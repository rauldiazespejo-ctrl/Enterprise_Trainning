// Panel de Diagnóstico y Sincronización de Cursos — CapacitaPro
import React, { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage';
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Database, HardDrive, Users, ArrowRight, Upload
} from 'lucide-react';

type Tab = 'diagnostico' | 'migrar' | 'usuarios';

interface SbCourse  { id: string; title: string; status: string; organization_id: string; created_at: string; }
interface SbAssign  { id: string; course_id: string; user_id: string; status: string; }
interface SbProfile { id: string; name: string; email: string; role: string; rut?: string; }
interface LocalCourse { id: string; title: string; status: string; modules?: unknown[]; [k: string]: unknown; }

interface DiagResult {
  sbCourses: SbCourse[];
  sbAssignments: SbAssign[];
  sbProfiles: SbProfile[];
  localCourses: LocalCourse[];
  localAssignments: unknown[];
  orphanAssignments: SbAssign[];   // assignments cuyo course_id no existe en Supabase
  localOnlyCourses: LocalCourse[]; // cursos solo en localStorage
}

interface UserCheck {
  profile: SbProfile;
  sbAssignments: SbAssign[];
  visibleCourses: SbCourse[];
  missingCourses: string[];
}

const CourseSync: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab]         = useState<Tab>('diagnostico');
  const [loading, setLoading] = useState(false);
  const [diag, setDiag]       = useState<DiagResult | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [migLog, setMigLog]   = useState<string[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [userChecks, setUserChecks] = useState<UserCheck[]>([]);
  const [checking, setChecking]     = useState(false);

  // ── Tab 1: Diagnóstico ──────────────────────────────────────────────────────

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    setDiagError(null);
    setDiag(null);
    try {
      const [{ data: sbCourses, error: ec }, { data: sbAssignments, error: ea }, { data: sbProfiles, error: ep }] =
        await Promise.all([
          supabase.from('courses').select('id, title, status, organization_id, created_at').order('created_at'),
          supabase.from('course_assignments').select('id, course_id, user_id, status'),
          supabase.from('profiles').select('id, name, email, role, rut').order('name'),
        ]);

      if (ec) throw new Error(`Cursos: ${ec.message}`);
      if (ea) throw new Error(`Asignaciones: ${ea.message}`);
      if (ep) throw new Error(`Perfiles: ${ep.message}`);

      const sbIds    = new Set((sbCourses || []).map(c => c.id));
      const localC   = loadFromStorage<LocalCourse[]>(STORAGE_KEYS.courses, []);
      const localA   = loadFromStorage<unknown[]>(STORAGE_KEYS.assignments, []);

      const orphanA  = (sbAssignments || []).filter(a => !sbIds.has(a.course_id));
      const localOnly = localC.filter(c => !sbIds.has(c.id));

      setDiag({
        sbCourses:        sbCourses   || [],
        sbAssignments:    sbAssignments || [],
        sbProfiles:       sbProfiles   || [],
        localCourses:     localC,
        localAssignments: localA,
        orphanAssignments: orphanA,
        localOnlyCourses:  localOnly,
      });
    } catch (err: unknown) {
      setDiagError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Tab 2: Migrar ───────────────────────────────────────────────────────────

  const runMigration = useCallback(async () => {
    if (!diag || !user) return;
    setMigrating(true);
    const log: string[] = [];

    // Obtener org_id fresco
    const { data: prof } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    const orgId = (prof as any)?.organization_id;
    if (!orgId) {
      log.push('❌ No se encontró organization_id en el perfil del admin. Operación cancelada.');
      setMigLog(log);
      setMigrating(false);
      return;
    }
    log.push(`✅ Organization ID: ${orgId}`);
    setMigLog([...log]);

    // Migrar cursos locales a Supabase
    const sbIds = new Set(diag.sbCourses.map(c => c.id));
    const toMigrate = diag.localOnlyCourses;

    if (toMigrate.length === 0) {
      log.push('ℹ️  No hay cursos locales pendientes de migrar.');
    }

    for (const course of toMigrate) {
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
        log.push(`❌ Curso "${course.title}": ${error.message}`);
      } else {
        sbIds.add(course.id);
        log.push(`✅ Curso migrado: "${course.title}"`);
      }
      setMigLog([...log]);
    }

    // Migrar asignaciones locales que ahora tienen course en Supabase
    const localAssigns = loadFromStorage<any[]>(STORAGE_KEYS.assignments, []);
    const sbAssignIds  = new Set(diag.sbAssignments.map(a => a.id));
    let migratedA = 0;

    for (const a of localAssigns) {
      if (sbAssignIds.has(a.id)) continue;       // ya existe
      if (!sbIds.has(a.courseId)) continue;      // curso no migrado
      const { error } = await supabase.from('course_assignments').upsert({
        id:          a.id,
        course_id:   a.courseId,
        user_id:     a.userId,
        assigned_by: a.assignedBy || user.id,
        assigned_at: a.assignedAt instanceof Date ? a.assignedAt.toISOString() : a.assignedAt || new Date().toISOString(),
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

  // ── Tab 3: Verificar por usuario ────────────────────────────────────────────

  const runUserCheck = useCallback(async () => {
    if (!diag) return;
    setChecking(true);
    const results: UserCheck[] = [];

    for (const profile of diag.sbProfiles.filter(p => p.role === 'employee' || p.role === 'admin')) {
      const assigns = diag.sbAssignments.filter(a => a.user_id === profile.id);
      const sbIds   = new Set(diag.sbCourses.map(c => c.id));
      const visibleCourses = assigns
        .filter(a => sbIds.has(a.course_id))
        .map(a => diag.sbCourses.find(c => c.id === a.course_id)!)
        .filter(Boolean);
      const missingCourses = assigns
        .filter(a => !sbIds.has(a.course_id))
        .map(a => a.course_id);

      results.push({ profile, sbAssignments: assigns, visibleCourses, missingCourses });
    }

    setUserChecks(results);
    setChecking(false);
  }, [diag]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'diagnostico', label: 'Diagnóstico' },
    { id: 'migrar',      label: 'Migrar datos' },
    { id: 'usuarios',    label: 'Ver por usuario' },
  ];

  return (
    <MainLayout title="Sincronización de Cursos" subtitle="Diagnóstico y migración de datos" isAdmin>
      <div className="space-y-4 max-w-5xl">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-[#D15F3D] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Diagnóstico ── */}
        {tab === 'diagnostico' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={runDiagnostic} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Analizando…' : 'Ejecutar diagnóstico'}
              </Button>
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
                {/* Resumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Database, label: 'Cursos en Supabase', val: diag.sbCourses.length,     color: 'text-emerald-400' },
                    { icon: HardDrive, label: 'Cursos en localStorage', val: diag.localCourses.length, color: 'text-amber-400' },
                    { icon: AlertTriangle, label: 'Solo en localStorage', val: diag.localOnlyCourses.length, color: diag.localOnlyCourses.length > 0 ? 'text-red-400' : 'text-emerald-400' },
                    { icon: Users, label: 'Usuarios en Supabase', val: diag.sbProfiles.length,    color: 'text-blue-400' },
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
                    Cursos confirmados en Supabase ({diag.sbCourses.length})
                  </h3>
                  {diag.sbCourses.length === 0
                    ? <p className="text-slate-500 text-sm">Ningún curso encontrado en Supabase.</p>
                    : (
                      <div className="space-y-1.5">
                        {diag.sbCourses.map(c => (
                          <div key={c.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-700/50">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-white flex-1 truncate">{c.title}</span>
                            <Badge variant={c.status === 'published' ? 'success' : 'warning'}>
                              {c.status}
                            </Badge>
                            <span className="text-slate-500 text-xs tabular-nums">
                              {new Date(c.created_at).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </Card>

                {/* Cursos solo en localStorage */}
                {diag.localOnlyCourses.length > 0 && (
                  <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      Cursos SOLO en localStorage — empleados no pueden verlos ({diag.localOnlyCourses.length})
                    </h3>
                    <div className="space-y-1.5 mb-4">
                      {diag.localOnlyCourses.map(c => (
                        <div key={c.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-amber-500/10">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-white flex-1 truncate">{c.title}</span>
                          <span className="text-slate-500 text-xs font-mono truncate max-w-[120px]">{c.id}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setTab('migrar')}>
                      <ArrowRight className="w-4 h-4" />
                      Ir a Migrar
                    </Button>
                  </Card>
                )}

                {/* Asignaciones */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Asignaciones en Supabase: {diag.sbAssignments.length}
                    {diag.orphanAssignments.length > 0 && (
                      <span className="ml-2 text-red-400 text-xs">
                        ({diag.orphanAssignments.length} huérfanas — course_id no existe en Supabase)
                      </span>
                    )}
                  </h3>
                  {diag.sbAssignments.length === 0
                    ? <p className="text-slate-500 text-sm">Sin asignaciones en Supabase.</p>
                    : (
                      <div className="space-y-1.5">
                        {diag.sbAssignments.map(a => {
                          const course  = diag.sbCourses.find(c => c.id === a.course_id);
                          const profile = diag.sbProfiles.find(p => p.id === a.user_id);
                          const ok = Boolean(course);
                          return (
                            <div key={a.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-700/50">
                              {ok
                                ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <XCircle    className="w-4 h-4 text-red-400 shrink-0" />
                              }
                              <span className="text-slate-400 w-32 truncate">{profile?.name || a.user_id.slice(0, 8)}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span className={`flex-1 truncate ${ok ? 'text-white' : 'text-red-400'}`}>
                                {course?.title || `[Curso no en Supabase: ${a.course_id.slice(0, 8)}…]`}
                              </span>
                              <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'warning'}>
                                {a.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </Card>

                {/* Resultado global */}
                {diag.localOnlyCourses.length === 0 && diag.orphanAssignments.length === 0 ? (
                  <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-emerald-400 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      ✅ Todo sincronizado — los empleados pueden ver sus cursos correctamente.
                    </p>
                  </Card>
                ) : (
                  <Card className="p-4 border-red-500/30 bg-red-500/5">
                    <p className="text-red-400 font-semibold flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      ⚠️ Hay datos fuera de Supabase. Usa la pestaña "Migrar datos" para sincronizar.
                    </p>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: Migrar ── */}
        {tab === 'migrar' && (
          <div className="space-y-4">
            {!diag && (
              <Card className="p-6 text-center">
                <p className="text-slate-400 mb-4">Primero ejecuta el diagnóstico.</p>
                <Button onClick={() => setTab('diagnostico')}>Ir a Diagnóstico</Button>
              </Card>
            )}

            {diag && (
              <>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Plan de migración</h3>
                  <ul className="text-sm text-slate-300 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#D15F3D]" />
                      {diag.localOnlyCourses.length} cursos locales → Supabase
                    </li>
                    <li className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#D15F3D]" />
                      Asignaciones locales pendientes → Supabase (FK validada)
                    </li>
                    <li className="flex items-center gap-2 text-slate-500">
                      <CheckCircle className="w-4 h-4" />
                      {diag.sbCourses.length} cursos ya en Supabase (no se tocan)
                    </li>
                  </ul>
                </Card>

                <Button onClick={runMigration} disabled={migrating || diag.localOnlyCourses.length === 0}>
                  <Upload className={`w-4 h-4 ${migrating ? 'animate-pulse' : ''}`} />
                  {migrating ? 'Migrando…' : 'Ejecutar migración'}
                </Button>

                {diag.localOnlyCourses.length === 0 && migLog.length === 0 && (
                  <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-emerald-400 text-sm">No hay cursos locales pendientes de migrar.</p>
                  </Card>
                )}

                {migLog.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Log de migración</h3>
                    <div className="bg-black/30 rounded-lg p-3 font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
                      {migLog.map((line, i) => (
                        <p key={i} className={
                          line.startsWith('✅') ? 'text-emerald-400' :
                          line.startsWith('❌') ? 'text-red-400' :
                          line.startsWith('ℹ️') ? 'text-blue-400' :
                          'text-slate-400'
                        }>
                          {line}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB 3: Ver por usuario ── */}
        {tab === 'usuarios' && (
          <div className="space-y-4">
            {!diag && (
              <Card className="p-6 text-center">
                <p className="text-slate-400 mb-4">Primero ejecuta el diagnóstico.</p>
                <Button onClick={() => setTab('diagnostico')}>Ir a Diagnóstico</Button>
              </Card>
            )}

            {diag && (
              <>
                <Button onClick={runUserCheck} disabled={checking}>
                  <Users className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Verificando…' : 'Verificar visibilidad por usuario'}
                </Button>

                {userChecks.map(uc => (
                  <Card key={uc.profile.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D15F3D] to-[#B34E2D] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {uc.profile.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{uc.profile.name}</p>
                        <p className="text-slate-500 text-xs">{uc.profile.rut || uc.profile.email}</p>
                      </div>
                      <Badge variant={uc.profile.role === 'admin' ? 'info' : 'default'}>
                        {uc.profile.role}
                      </Badge>
                      {uc.missingCourses.length === 0
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <XCircle    className="w-5 h-5 text-red-400" />
                      }
                    </div>

                    {uc.sbAssignments.length === 0 ? (
                      <p className="text-slate-500 text-xs">Sin asignaciones en Supabase.</p>
                    ) : (
                      <div className="space-y-1">
                        {uc.sbAssignments.map(a => {
                          const course = diag.sbCourses.find(c => c.id === a.course_id);
                          return (
                            <div key={a.id} className="flex items-center gap-2 text-xs py-1 border-b border-slate-700/30">
                              {course
                                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                : <XCircle    className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              }
                              <span className={course ? 'text-slate-300' : 'text-red-400'}>
                                {course?.title || `Curso no visible (${a.course_id.slice(0, 12)}…)`}
                              </span>
                              <span className="ml-auto text-slate-500">{a.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default CourseSync;
