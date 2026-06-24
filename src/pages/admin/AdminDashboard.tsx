// Dashboard del Administrador - Layout Bento de alto impacto
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, StatCard, Button, Badge, ProgressBar, Skeleton, EmptyState } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  FileText,
  Upload,
  ArrowRight,
  Inbox,
  Activity,
  Zap,
  BarChart3,
  GraduationCap,
  Target
} from 'lucide-react';

// ── SVG Chart helpers ────────────────────────────────────────────────────────

const DonutChart: React.FC<{ value: number; color?: string }> = ({ value, color = 'hsl(var(--brand))' }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(value)}%</span>
      </div>
    </div>
  );
};

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = 'hsl(var(--brand))' }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="animate-fillBar"
      />
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparklineGradient)" />
    </svg>
  );
};

const HorizontalBars: React.FC<{ items: { label: string; value: number; color?: string }[] }> = ({ items }) => {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-3 w-full">
      {items.map((item, idx) => (
        <div key={idx} className="group">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-foreground font-medium truncate pr-2">{item.label}</span>
            <span className="text-muted-foreground tabular-nums">{item.value}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--brand)))'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

const AdminDashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 min-h-[160px]">
          <div className="flex items-start justify-between h-full">
            <div className="space-y-3 w-2/3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-14 w-14 rounded-2xl" />
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 min-h-[300px]">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="flex items-center justify-center h-48">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      </Card>
      <Card className="p-6 min-h-[300px]">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card className="p-6">
      <Skeleton className="h-6 w-56 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [pendingAssignments, setPendingAssignments] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      const [{ data }, { data: pending }] = await Promise.all([
        db.getStats(),
        db.getPendingAssignments()
      ]);
      if (mounted) {
        if (data) setStats(data);
        setPendingAssignments(pending || []);
        setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard" subtitle="Resumen de la plataforma" isAdmin>
        <AdminDashboardSkeleton />
      </MainLayout>
    );
  }

  const {
    totalEmployees = 0,
    activeCourses = 0,
    totalCertificates = 0,
    completionRate = 0,
    recentEmployees = [],
    recentCourses = [],
    recentActivity = []
  } = stats || {};

  // Prepare chart data
  const courseBarData = (recentCourses || [])
    .slice(0, 5)
    .map((c: any) => ({ label: c.title, value: c.enrolled || 0 }));

  const sparkData = recentActivity && recentActivity.length > 0
    ? recentActivity.map((_: any, i: number) => 30 + (i % 5) * 15)
    : [40, 55, 45, 70, 60, 85, 75];

  return (
    <MainLayout title="Dashboard" subtitle="Resumen de la plataforma" isAdmin>
      <div className="space-y-8 relative overflow-hidden overflow-x-hidden">
        {/* Ambient light */}
        <div className="absolute top-0 right-0 ambient-blob ambient-blob-orange" style={{ top: '-120px', right: '-80px' }} />
        <div className="absolute bottom-0 left-0 ambient-blob ambient-blob-navy" style={{ bottom: '-120px', left: '-80px' }} />

        {/* Header + Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-bentoEnter">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Hola, {user?.name?.split(' ')[0]}</h2>
            <p className="text-sm text-muted-foreground">Este es el panorama de capacitación de hoy.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/documents" className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2 tap-target-min min-h-11">
                <Upload className="w-4 h-4" />
                Subir Documento
              </Button>
            </Link>
            <Link to="/admin/courses" className="flex-1 sm:flex-none">
              <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center gap-2 tap-target-min min-h-11">
                <Plus className="w-4 h-4" />
                Crear Curso
              </Button>
            </Link>
            <Link to="/admin/assignments" className="flex-1 sm:flex-none">
              <Button variant="ghost" className="w-full sm:w-auto flex items-center justify-center gap-2 tap-target-min min-h-11">
                <FileText className="w-4 h-4" />
                Asignar
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick action pills */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-bentoEnter" style={{ animationDelay: '80ms' }}>
          {[
            { icon: Users, label: 'Empleados', to: '/admin/employees', color: 'text-secondary bg-secondary/10' },
            { icon: BookOpen, label: 'Cursos', to: '/admin/courses', color: 'text-primary bg-primary/10' },
            { icon: Award, label: 'Certificados', to: '/admin/certificates', color: 'text-accent bg-accent/10' },
            { icon: BarChart3, label: 'Reportes', to: '/admin/reports', color: 'text-emerald-500 bg-emerald-500/10' },
          ].map(({ icon: Icon, label, to, color }) => (
            <Link key={label} to={to} className="min-h-[44px]">
              <Card className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:-translate-y-1 transition-all h-full min-h-11">
                <div className={`p-2.5 sm:p-3 rounded-xl ${color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="font-semibold text-foreground text-sm sm:text-base">{label}</span>
              </Card>
            </Link>
          ))}
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 bento-grid">
          {/* Large stat card - employees */}
          <Card className="p-6 md:col-span-1 animate-bentoEnter relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Empleados</p>
                  <p className="text-4xl font-extrabold text-foreground mt-1 tracking-tight">
                    <AnimatedNumber value={totalEmployees} />
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-brand/10 text-brand">
                  <Users className="w-7 h-7" />
                </div>
              </div>
              <div className="mt-6">
                <Sparkline data={sparkData} />
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                  <span className="text-xs text-muted-foreground">vs mes anterior</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Large stat card - courses + certificates */}
          <Card className="p-6 md:col-span-1 animate-bentoEnter relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 grid grid-cols-2 gap-4 h-full">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Cursos Activos</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  <AnimatedNumber value={activeCourses} />
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-secondary/10 text-secondary w-fit">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Certificados</p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  <AnimatedNumber value={totalCertificates} />
                </p>
                <div className="mt-4 p-3 rounded-2xl bg-accent/10 text-accent w-fit">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <div className="col-span-2 mt-auto pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasa de completación</span>
                  <span className="font-bold text-foreground">{completionRate}%</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Donut chart card */}
          <Card className="p-6 animate-bentoEnter">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Cumplimiento General</p>
                <h3 className="text-lg font-bold text-foreground">Progreso total</h3>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <DonutChart value={completionRate} />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand" />
                  <span className="text-muted-foreground">Completado</span>
                  <span className="ml-auto font-semibold text-foreground">{Math.round(completionRate)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Pendiente</span>
                  <span className="ml-auto font-semibold text-foreground">{Math.round(100 - completionRate)}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Horizontal bars card */}
          <Card className="p-6 animate-bentoEnter">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Inscripciones</p>
                <h3 className="text-lg font-bold text-foreground">Top cursos</h3>
              </div>
              <Link to="/admin/courses" aria-label="Ver todos los cursos" className="text-brand hover:text-accent text-sm flex items-center gap-1 transition-colors tap-target-min">
                Ver <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {courseBarData.length > 0 ? (
              <HorizontalBars items={courseBarData} />
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                Sin datos de cursos
              </div>
            )}
          </Card>
        </div>

        {/* Recent Employees Table */}
        <Card className="p-6 animate-bentoEnter">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-foreground">Progreso de Empleados</h3>
              <p className="text-sm text-muted-foreground">Últimos empleados con actividad</p>
            </div>
            <Link to="/admin/employees" aria-label="Ver todos los empleados" className="text-brand hover:text-accent text-sm flex items-center gap-1 transition-colors tap-target-min">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empleado</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departamento</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progreso</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEmployees.length > 0 ? recentEmployees.map((emp: any) => (
                  <tr key={emp.id} className="group hover:bg-surface transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3 w-48">
                      <ProgressBar value={emp.progress} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={emp.progress >= 80 ? 'success' : emp.progress >= 40 ? 'warning' : 'default'}>
                        {emp.progress >= 80 ? 'Al día' : emp.progress >= 40 ? 'En curso' : 'Iniciando'}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<Users className="w-8 h-8" />}
                        title="Sin empleados recientes"
                        description="Aún no hay empleados con actividad reciente en la plataforma."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pending Assignments + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-bentoEnter">
          {/* Pending Assignments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Asignaciones Pendientes</h3>
                <p className="text-sm text-muted-foreground">Requieren atención</p>
              </div>
              <Link to="/admin/assignments" aria-label="Ver asignaciones pendientes" className="text-brand hover:text-accent text-sm flex items-center gap-1 transition-colors tap-target-min">
                Ver <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Empleado</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Curso</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingAssignments.length > 0 ? pendingAssignments.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-surface transition-colors">
                      <td className="px-3 py-3 text-sm text-foreground">{a.employeeName}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground truncate max-w-[140px]">{a.courseTitle}</td>
                      <td className="px-3 py-3">
                        <Badge variant={a.status === 'in_progress' ? 'warning' : 'default'}>
                          {a.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState
                          icon={<Inbox className="w-8 h-8" />}
                          title="No hay asignaciones pendientes"
                          description="Todas las asignaciones están al día."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Actividad Reciente</h3>
                <p className="text-sm text-muted-foreground">Últimas acciones</p>
              </div>
              <div className="p-2 rounded-xl bg-brand/10 text-brand">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 5).map((act: any) => (
                <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 hover:bg-surface transition-colors">
                  <div className={`p-2.5 rounded-xl ${
                    act.icon === 'CheckCircle' ? 'bg-emerald-500/15 text-emerald-500' :
                    act.icon === 'Award' ? 'bg-primary/15 text-primary' :
                    'bg-accent/15 text-accent'
                  }`}>
                    {act.icon === 'CheckCircle' && <CheckCircle className="w-4 h-4" />}
                    {act.icon === 'Award' && <Award className="w-4 h-4" />}
                    {act.icon === 'Clock' && <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{act.user} {act.detail}</p>
                    <p className="text-xs text-muted-foreground">{act.time}</p>
                  </div>
                </div>
              )) : (
                <EmptyState
                  icon={<Activity className="w-8 h-8" />}
                  title="Sin actividad reciente"
                  description="Aquí aparecerán las últimas acciones de los usuarios."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
