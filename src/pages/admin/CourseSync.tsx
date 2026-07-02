// Panel de Diagnóstico y Sincronización de Cursos — CapacitaPro
import React, { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Database, HardDrive, Users, ArrowRight, Upload,
  Shield, Wrench, Eye, EyeOff
} from 'lucide-react';

type Tab = 'diagnostico' | 'migrar' | 'usuarios' | 'reparar';

interface SbCourse  { id: string; title: string; status: string; organization_id: string; created_at: string; }
interface SbAssign  { id: string; course_id: string; user_id: string; status: string; }
interface SbProfile { id: string; name: string; email: string; role: string; rut?: string; organization_id: string | null; }
interface LocalCourse { id: string; title: string; status: string; modules?: unknown[]; [k: string]: unknown; }

interface DiagResult {
  orgId: string | null;
  sbCourses: SbCourse[];
  sbAssignments: SbAssign[];
  sbProfiles: SbProfile[];
  localCourses: LocalCourse[];
  localAssignments: unknown[];
  orphanAssignments: SbAssign[];
  localOnlyCourses: LocalCourse[];
  profilesWithoutOrg: SbProfile[];
  coursesWithBadOrg: SbCourse[];
}

interface UserVisibility {
  profile: SbProfile;
  assignments: SbAssign[];
  visibleCourses: { course: SbCourse; reason: string }[];
  blockedCourses: { course: SbCourse; reason: string }[];
  orgMatch: boolean;
}

const CourseSync: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab]         = useState<Tab>('diagnostico');
  const [loading, setLoading] = useState(false);
  const [diag, setDiag]       = useState<DiagResult | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [migLog, setMigLog]   = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [userVis, setUserVis] = useState<UserVisibility[]>([]);
  const [checking, setChecking] = useState(false);
  const [repairLog, setRepairLog] = useState<string[]>([]);
  const [repairing, setRepairing] = useState(false);

  // ── Tab 1: Diagnóstico completo ─────────────────────────────────────────────

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    setDiagError(null);
    setDiag(null);

    try {
      // Obtener org del admin actual
      const { data: myProf } = await supabase
        .from('profiles').select('organization_id').eq('id', user?.id ?? '').single();
      const myOrgId: string | null = (myProf as any)?.organization_id ?? null;

      const [
        { data: sbCourses,  error: ec },
        { data: sbAssigns,  error: ea },
        { data: sbProfiles, error: ep },
      ] = await Promise.all([
        supabase.from('courses').select('id, title, status, organization_id, created_at').order('created_at'),
        supabase.from('course_assignments').select('id, course_id, user_id, status'),
        supabase.from('profiles').select('id, name, email, role, rut, organization_id').order('name'),
      ]);

      if (ec) throw new Error(`Cursos: ${ec.message}`);
      if (ea) throw new Error(`Asignaciones: ${ea.message}`);
      if (ep) throw new Error(`Perfiles: ${ep.message}`);

      const courses:  SbCourse[]  = (sbCourses  || []) as SbCourse[];
      const assigns:  SbAssign[]  = (sbAssigns  || []) as SbAssign[];
      const profiles: SbProfile[] = (sbProfiles || []) as SbProfile[];

      const sbIds    = new Set(courses.map(c => c.id));
      const localC   = loadFromStorage<LocalCourse[]>(STORAGE_KEYS.courses, []);
      const localA   = loadFromStorage<unknown[]>(STORAGE_KEYS.assignments, []);

      setDiag({
        orgId:               myOrgId,
        sbCourses:           courses,
        sbAssignments:       assigns,
        sbProfiles:          profiles,
        localCourses:        localC,
        localAssignments:    localA,
        orphanAssignments:   assigns.filter(a => !sbIds.has(a.course_id)),
        localOnlyCourses:    localC.filter(c => !sbIds.has(c.id)),
        profilesWithoutOrg:  profiles.filter(p => !p.organization_id),
        coursesWithBadOrg:   courses.filter(c => !c.organization_id),
      });
    } catch (err: unknown) {
      setDiagError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Tab 3: Visibilidad real por usuario ────────────────────────────────────

  const runUserCheck = useCallback(async () => {
    if (!diag) return;
    setChecking(true);

    const results: UserVisibility[] = [];

    for (const profile of diag.sbProfiles) {
      const userAssigns = diag.sbAssignments.filter(a => a.user_id === profile.id);
      const isAdmin = ['admin', 'super_admin'].includes(profile.role);
      const orgMatch = !!profile.organization_id && profile.organization_id === diag.orgId;

      const visibleCourses: UserVisibility['visibleCourses'] = [];
      const blockedCourses: UserVisibility['blockedCourses'] = [];

      for (const course of diag.sbCourses) {
        const sameOrg = profile.organization_id === course.organization_id;
        const hasAssign = userAssigns.some(a => a.course_id === course.id);

        if (!sameOrg) {
          blockedCourses.push({ course, reason: `org diferente (perfil: ${profile.organization_id?.slice(0,8) || 'null'} ≠ curso: ${course.organization_id?.slice(0,8) || 'null'})` });
        } else if (!isAdmin && !hasAssign) {
          blockedCourses.push({ course, reason: 'sin asignación y no es admin' });
        } else {
          visibleCourses.push({ course, reason: isAdmin ? 'es admin' : 'tiene asignación' });
        }
      }

      results.push({ profile, assignments: userAssigns, visibleCourses, blockedCourses, orgMatch });
    }

    setUserVis(results);
    setChecking(false);
  }, [diag]);

  // ── Tab 2: Migrar localStorage → Supabase ─────────────────────────────────

  const runMigration = useCallback(async () => {
    if (!diag || !user) return;
    setMigrating(true);
    const log: string[] = [];

    const orgId = diag.orgId;
    if (!orgId) {
      log.push('❌ No se encontró organization_id del admin. Ejecuta primero "Reparar datos".');
      setMigLog([...log]);
      setMigrating(false);
      return;
    }
    log.push(`✅ Organization ID: ${orgId}`);

    const sbIds = new Set(diag.sbCourses.map(c => c.id));

    if (diag.localOnlyCourses.length === 0) {
      log.push('ℹ️  No hay cursos locales pendientes de migrar.');
    }

    for (const course of diag.localOnlyCourses) {
      const { error } = await supabase.from('courses').upsert({
        id:                 course.id,
        organization_id:    orgId,
        created_by:         (course.createdBy as string) || user.id,
        title:              course.title,
        description:        (course.description as string) || '',
        status:             course.status || 'draft',
        passing_score:      (course.passingScore as number) ?? 70,
        estimated_duration: (course.estimatedDuration as number) ?? 60,
        category:           (course.category as string) || null,
        difficulty:         (course.difficulty as string) || null,
        modules_data:       (course.modules as unknown[]) || [],
        updated_at:         new Date().toISOString(),
      });
      if (error) {
        log.push(`❌ "${course.title}": ${error.message}`);
      } else {
        sbIds.add(course.id);
        log.push(`✅ Migrado: "${course.title}"`);
      }
      setMigLog([...log]);
    }

    // Migrar asignaciones locales
    const localAssigns = loadFromStorage<any[]>(STORAGE_KEYS.assignments, []);
    const sbAssignIds  = new Set(diag.sbAssignments.map(a => a.id));
    let migratedA = 0;

    for (const a of localAssigns) {
      if (sbAssignIds.has(a.id) || !sbIds.has(a.courseId)) continue;
      const { error } = await supabase.from('course_assignments').upsert({
        id:          a.id,
        course_id:   a.courseId,
        user_id:     a.userId,
        assigned_by: a.assignedBy || user.id,
        assigned_at: a.assignedAt instanceof Date ? a.assignedAt.toISOString() : (a.assignedAt || new Date().toISOString()),
        due_date:    a.dueDate ? (a.dueDate instanceof Date ? a.dueDate.toISOString() : a.dueDate) : null,
        status:      a.status || 'pending',
        progress:    a.progress ?? 0,
      });
      if (!error) migratedA++;
    }

    if (migratedA > 0) log.push(`✅ Asignaciones migradas: ${migratedA}`);
    log.push('─── Migración completada ───');
    setMigLog([...log]);
    setMigrating(false);
    await runDiagnostic();
  }, [diag, user, runDiagnostic]);

  // ── Tab 4: Reparar datos (fix org_id, RLS, perfiles) ──────────────────────

  const runRepair = useCallback(async () => {
    setRepairing(true);
    const log: string[] = [];

    try {
      const { data: myProfile } = await supabase
        .from('profiles').select('organization_id').eq('id', user?.id ?? '').single();
      const orgId: string | undefined = (myProfile as any)?.organization_id;

      if (!orgId) {
        log.push('❌ Tu perfil no tiene organization_id. Contacta a un super_admin.');
        setRepairLog([...log]);
        setRepairing(false);
        return;
      }
      log.push(`✅ Organización de referencia: ${orgId}`);
      setRepairLog([...log]);

      // 1. Perfiles sin org
      const { data: orphanProfiles } = await supabase
        .from('profiles').select('id, name').is('organization_id', null);
      if (orphanProfiles && orphanProfiles.length > 0) {
        const { error } = await supabase
          .from('profiles').update({ organization_id: orgId }).is('organization_id', null);
        log.push(error
          ? `❌ Error reparando perfiles: ${error.message}`
          : `✅ Perfiles sin org reparados: ${orphanProfiles.map((p:any) => p.name).join(', ')}`
        );
      } else {
        log.push('ℹ️  Todos los perfiles tienen organization_id.');
      }
      setRepairLog([...log]);

      // 2. Cursos sin organization_id
      const { data: coursesNoOrg } = await supabase
        .from('courses').select('id, title').is('organization_id', null);
      if (coursesNoOrg && coursesNoOrg.length > 0) {
        const { error } = await supabase
          .from('courses').update({ organization_id: orgId }).is('organization_id', null);
        log.push(error
          ? `❌ Error reparando cursos: ${error.message}`
          : `✅ Cursos sin org reparados: ${coursesNoOrg.map((c:any) => c.title).join(', ')}`
        );
      } else {
        log.push('ℹ️  Todos los cursos tienen organization_id.');
      }
      setRepairLog([...log]);

      // 3. Verificar cursos de otra org (no reparar automáticamente — podrían ser de otro tenant)
      const { data: otherOrgCourses } = await supabase
        .from('courses').select('id, title, organization_id').neq('organization_id', orgId);
      if (otherOrgCourses && otherOrgCourses.length > 0) {
        log.push(`⚠️  ${otherOrgCourses.length} curso(s) de otra organización detectados.`);
        otherOrgCourses.forEach((c: any) => log.push(`   → "${c.title}" (org: ${c.organization_id?.slice(0,8)})`));
        log.push('   ¿Son tuyos? Si es un solo tenant, ejecuta el SQL C3 en DIAGNOSTICO_SYNC.sql');
      } else {
        log.push('✅ Todos los cursos pertenecen a tu organización.');
      }
      setRepairLog([...log]);

      // 4. Verificar que las asignaciones tienen user_id válido en profiles
      const { data: assigns } = await supabase
        .from('course_assignments').select('id, user_id, course_id, status');
      const { data: profiles } = await supabase
        .from('profiles').select('id');
      const validUserIds = new Set((profiles || []).map((p: any) => p.id));
      const orphanUserAssigns = (assigns || []).filter((a: any) => !validUserIds.has(a.user_id));
      if (orphanUserAssigns.length > 0) {
        log.push(`⚠️  ${orphanUserAssigns.length} asignación(es) con user_id inválido (usuario eliminado?)`);
      } else {
        log.push('✅ Todas las asignaciones tienen usuarios válidos en profiles.');
      }
      setRepairLog([...log]);

      log.push('');
      log.push('─── Reparación completada ───');
      log.push('Ahora: ve a Diagnóstico → Ejecutar diagnóstico para confirmar.');
      setRepairLog([...log]);
      await runDiagnostic();
    } catch (err: unknown) {
      log.push(`❌ Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
      setRepairLog([...log]);
    } finally {
      setRepairing(false);
    }
  }, [user, runDiagnostic]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'diagnostico', label: 'Diagnóstico',    icon: Database  },
    { id: 'migrar',      label: 'Migrar datos',   icon: Upload    },
    { id: 'usuarios',    label: 'Visibilidad',    icon: Eye       },
    { id: 'reparar',     label: 'Reparar',        icon: Wrench    },
  ];

  // Resumen de salud
  const health = diag ? {
    ok: diag.localOnlyCourses.length === 0 &&
        diag.orphanAssignments.length === 0 &&
        diag.profilesWithoutOrg.length === 0 &&
        diag.coursesWithBadOrg.length === 0,
  } : null;

  return (
    <MainLayout title="Sincronización" subtitle="Diagnóstico y reparación de datos" isAdmin>
      <div className="space-y-4 max-w-5xl">

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-800/50 rounded-xl w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === id
                  ? 'bg-brand text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ══ TAB 1: Diagnóstico ══ */}
        {tab === 'diagnostico' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Button onClick={runDiagnostic} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Analizando…' : 'Ejecutar diagnóstico'}
              </Button>
              {diag && (
                <Button onClick={() => setTab('usuarios')} variant="secondary">
                  <Eye className="w-4 h-4" />
                  Ver visibilidad por usuario
                </Button>
              )}
            </div>

            {diagError && (
              <Card className="p-4 border-red-500/30 bg-red-500/5">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {diagError}
                </p>
              </Card>
            )}

            {diag && (
              <>
                {/* Estado de salud general */}
                <Card className={`p-4 border ${health?.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <div className="flex items-center gap-3">
                    {health?.ok
                      ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                      : <XCircle className="w-6 h-6 text-red-400" />
                    }
                    <div>
                      <p className={`font-semibold ${health?.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {health?.ok
                          ? '✅ Base de datos sincronizada — los usuarios pueden ver sus cursos.'
                          : '⚠️ Se detectaron problemas de sincronización.'
                        }
                      </p>
                      {!health?.ok && (
                        <p className="text-slate-400 text-xs mt-1">
                          Usa las pestañas <strong>Migrar datos</strong> y <strong>Reparar</strong> para corregirlos.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Database,      label: 'Cursos en Supabase',    val: diag.sbCourses.length,          color: 'text-emerald-400' },
                    { icon: HardDrive,     label: 'Solo en localStorage',  val: diag.localOnlyCourses.length,   color: diag.localOnlyCourses.length > 0  ? 'text-red-400' : 'text-emerald-400' },
                    { icon: AlertTriangle, label: 'Asignaciones huérfanas',val: diag.orphanAssignments.length,  color: diag.orphanAssignments.length > 0 ? 'text-red-400' : 'text-emerald-400' },
                    { icon: Users,         label: 'Perfiles sin org',      val: diag.profilesWithoutOrg.length, color: diag.profilesWithoutOrg.length > 0 ? 'text-red-400' : 'text-emerald-400' },
                  ].map(({ icon: Icon, label, val, color }) => (
                    <Card key={label} className="p-4">
                      <Icon className={`w-5 h-5 mb-2 ${color}`} />
                      <p className={`text-2xl font-bold ${color}`}>{val}</p>
                      <p className="text-xs text-slate-400 mt-1">{label}</p>
                    </Card>
                  ))}
                </div>

                {/* Cursos en Supabase */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Cursos en Supabase ({diag.sbCourses.length})
                    <span className="text-xs text-slate-500 font-normal ml-2">org: {diag.orgId?.slice(0,8)}…</span>
                  </h3>
                  {diag.sbCourses.length === 0
                    ? <p className="text-slate-500 text-sm">Sin cursos en Supabase. Crea o migra cursos desde localStorage.</p>
                    : (
                      <div className="space-y-1.5">
                        {diag.sbCourses.map(c => {
                          const orgOk = c.organization_id === diag.orgId;
                          return (
                            <div key={c.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-700/50">
                              {orgOk
                                ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                              }
                              <span className="text-white flex-1 truncate">{c.title}</span>
                              <Badge variant={c.status === 'published' ? 'success' : 'warning'}>{c.status}</Badge>
                              {!orgOk && <span className="text-amber-400 text-xs">org diferente</span>}
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </Card>

                {/* Cursos solo en localStorage */}
                {diag.localOnlyCourses.length > 0 && (
                  <Card className="p-4 border-red-500/20 bg-red-500/5">
                    <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      ❌ Cursos SOLO en este navegador — empleados NO pueden verlos ({diag.localOnlyCourses.length})
                    </h3>
                    <div className="space-y-1.5 mb-4">
                      {diag.localOnlyCourses.map(c => (
                        <div key={c.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-red-500/10">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-white flex-1 truncate">{c.title}</span>
                          <span className="text-slate-500 text-xs font-mono">{c.id.slice(0,12)}…</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setTab('migrar')}>
                      <ArrowRight className="w-4 h-4" />
                      Migrar a Supabase ahora
                    </Button>
                  </Card>
                )}

                {/* Perfiles sin org */}
                {diag.profilesWithoutOrg.length > 0 && (
                  <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Perfiles sin organization_id — RLS bloquea todos sus cursos ({diag.profilesWithoutOrg.length})
                    </h3>
                    <div className="space-y-1 mb-3">
                      {diag.profilesWithoutOrg.map(p => (
                        <div key={p.id} className="flex items-center gap-3 text-xs py-1 border-b border-amber-500/10">
                          <span className="text-white">{p.name}</span>
                          <span className="text-slate-500">{p.email}</span>
                          <Badge variant="warning">{p.role}</Badge>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setTab('reparar')}>
                      <Wrench className="w-4 h-4" />
                      Ir a Reparar
                    </Button>
                  </Card>
                )}

                {/* Asignaciones */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Asignaciones en Supabase: {diag.sbAssignments.length}
                    {diag.orphanAssignments.length > 0 && (
                      <span className="ml-2 text-red-400 text-xs">
                        ({diag.orphanAssignments.length} con curso faltante en Supabase)
                      </span>
                    )}
                  </h3>
                  {diag.sbAssignments.length === 0 ? (
                    <p className="text-slate-500 text-sm">Sin asignaciones en Supabase.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {diag.sbAssignments.map(a => {
                        const course  = diag.sbCourses.find(c => c.id === a.course_id);
                        const profile = diag.sbProfiles.find(p => p.id === a.user_id);
                        return (
                          <div key={a.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-700/50">
                            {course
                              ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              : <XCircle    className="w-4 h-4 text-red-400 shrink-0" />
                            }
                            <span className="text-slate-400 w-32 truncate">{profile?.name || a.user_id.slice(0,8)}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className={`flex-1 truncate ${course ? 'text-white' : 'text-red-400'}`}>
                              {course?.title || `[Curso no en Supabase: ${a.course_id.slice(0,12)}…]`}
                            </span>
                            <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'warning'}>
                              {a.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ══ TAB 2: Migrar ══ */}
        {tab === 'migrar' && (
          <div className="space-y-4">
            {!diag ? (
              <Card className="p-6 text-center">
                <p className="text-slate-400 mb-4">Primero ejecuta el diagnóstico.</p>
                <Button onClick={() => setTab('diagnostico')}>Ir a Diagnóstico</Button>
              </Card>
            ) : (
              <>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Plan de migración</h3>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className={diag.localOnlyCourses.length > 0 ? 'text-red-400' : 'text-slate-500'}>
                        {diag.localOnlyCourses.length > 0 ? '⚠️' : '✅'}
                      </span>
                      {diag.localOnlyCourses.length} cursos locales pendientes de subir a Supabase
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-slate-500">ℹ️</span>
                      Se migrarán también las asignaciones locales que apunten a esos cursos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✅</span>
                      {diag.sbCourses.length} cursos ya en Supabase (no se modifican)
                    </li>
                  </ul>
                </Card>

                <Button
                  onClick={runMigration}
                  disabled={migrating || diag.localOnlyCourses.length === 0}
                >
                  <Upload className={`w-4 h-4 ${migrating ? 'animate-pulse' : ''}`} />
                  {migrating ? 'Migrando…' : `Migrar ${diag.localOnlyCourses.length} curso(s)`}
                </Button>

                {diag.localOnlyCourses.length === 0 && migLog.length === 0 && (
                  <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-emerald-400 text-sm">
                      ✅ No hay cursos locales pendientes. Todo está en Supabase.
                    </p>
                  </Card>
                )}

                {migLog.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Log</h3>
                    <div className="bg-black/30 rounded-lg p-3 font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
                      {migLog.map((line, i) => (
                        <p key={i} className={
                          line.startsWith('✅') ? 'text-emerald-400' :
                          line.startsWith('❌') ? 'text-red-400' :
                          line.startsWith('ℹ️') ? 'text-blue-400' :
                          'text-slate-400'
                        }>{line}</p>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ TAB 3: Visibilidad por usuario ══ */}
        {tab === 'usuarios' && (
          <div className="space-y-4">
            {!diag ? (
              <Card className="p-6 text-center">
                <p className="text-slate-400 mb-4">Primero ejecuta el diagnóstico.</p>
                <Button onClick={() => setTab('diagnostico')}>Ir a Diagnóstico</Button>
              </Card>
            ) : (
              <>
                <div className="flex gap-3">
                  <Button onClick={runUserCheck} disabled={checking}>
                    <Shield className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                    {checking ? 'Simulando RLS…' : 'Simular visibilidad RLS por usuario'}
                  </Button>
                </div>

                <Card className="p-3 bg-slate-800/30">
                  <p className="text-xs text-slate-400">
                    Este análisis simula localmente las reglas RLS de Supabase para predecir qué ve cada usuario.
                    Condición: <code className="bg-black/30 px-1 rounded">organization_id igual</code> Y
                    (<code className="bg-black/30 px-1 rounded">es_admin</code> O
                    <code className="bg-black/30 px-1 rounded">tiene_asignacion</code>)
                  </p>
                </Card>

                {userVis.map(uv => {
                  const allOk = uv.blockedCourses.length === 0;
                  return (
                    <Card key={uv.profile.id} className={`p-4 border ${allOk ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-[brand] flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {uv.profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{uv.profile.name}</p>
                          <p className="text-slate-500 text-xs truncate">{uv.profile.rut || uv.profile.email}</p>
                        </div>
                        <Badge variant={uv.profile.role === 'admin' || uv.profile.role === 'super_admin' ? 'info' : 'default'}>
                          {uv.profile.role}
                        </Badge>
                        {uv.orgMatch
                          ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        }
                        {allOk
                          ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          : <XCircle    className="w-5 h-5 text-red-400 shrink-0" />
                        }
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Visibles */}
                        <div>
                          <p className="text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> Puede ver ({uv.visibleCourses.length})
                          </p>
                          {uv.visibleCourses.length === 0
                            ? <p className="text-slate-600 italic">ninguno</p>
                            : uv.visibleCourses.map(({ course, reason }) => (
                              <div key={course.id} className="flex items-start gap-1.5 py-0.5">
                                <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                <span className="text-slate-300 truncate" title={reason}>{course.title}</span>
                              </div>
                            ))
                          }
                        </div>
                        {/* Bloqueados */}
                        <div>
                          <p className="text-red-400 font-semibold mb-1 flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> Bloqueado ({uv.blockedCourses.length})
                          </p>
                          {uv.blockedCourses.length === 0
                            ? <p className="text-slate-600 italic">ninguno</p>
                            : uv.blockedCourses.map(({ course, reason }) => (
                              <div key={course.id} className="flex items-start gap-1.5 py-0.5">
                                <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-slate-400 truncate block">{course.title}</span>
                                  <span className="text-slate-600 block">{reason}</span>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ══ TAB 4: Reparar ══ */}
        {tab === 'reparar' && (
          <div className="space-y-4">
            <Card className="p-4 border-amber-500/20 bg-amber-500/5">
              <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Reparación automática de integridad
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                Detecta y corrige problemas de <code className="bg-black/30 px-1 rounded">organization_id</code>
                en perfiles y cursos. Resuelve el caso donde usuarios (ej: Luis Ojeda) tienen asignaciones
                pero no ven cursos por mismatch de organización en RLS.
              </p>
              <ul className="text-sm text-slate-400 space-y-1.5 mb-4">
                <li>✔ Perfiles sin <code className="bg-black/20 px-1 rounded">organization_id</code> → se asigna tu org</li>
                <li>✔ Cursos con <code className="bg-black/20 px-1 rounded">organization_id</code> nulo → se asigna tu org</li>
                <li>✔ Asignaciones con <code className="bg-black/20 px-1 rounded">user_id</code> inválido → se detectan</li>
                <li>⚠ Cursos de otra org → se reportan (no se tocan)</li>
              </ul>
              <Button onClick={runRepair} disabled={repairing}>
                <Wrench className={`w-4 h-4 ${repairing ? 'animate-spin' : ''}`} />
                {repairing ? 'Reparando…' : 'Ejecutar reparación'}
              </Button>
            </Card>

            <Card className="p-4 border-blue-500/20 bg-blue-500/5">
              <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Diagnóstico avanzado vía SQL Editor
              </h3>
              <p className="text-slate-300 text-sm mb-2">
                Para casos complejos (múltiples orgs, usuarios de otro tenant, etc.), ejecuta el
                script SQL completo en el panel de Supabase:
              </p>
              <p className="text-slate-500 text-xs font-mono bg-black/30 p-2 rounded">
                supabase/DIAGNOSTICO_SYNC.sql
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Supabase Dashboard → SQL Editor → pega el contenido del archivo → ejecuta sección por sección.
              </p>
            </Card>

            {repairLog.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Log de reparación</h3>
                <div className="bg-black/30 rounded-lg p-3 font-mono text-xs space-y-1 max-h-80 overflow-y-auto">
                  {repairLog.map((line, i) => (
                    <p key={i} className={
                      line.startsWith('✅') ? 'text-emerald-400' :
                      line.startsWith('❌') ? 'text-red-400' :
                      line.startsWith('⚠️') ? 'text-amber-400' :
                      line.startsWith('ℹ️') ? 'text-blue-400' :
                      line.startsWith('───') ? 'text-slate-600' :
                      'text-slate-300'
                    }>{line}</p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default CourseSync;
