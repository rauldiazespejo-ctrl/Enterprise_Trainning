// Dashboard del Administrador - Modern Dark Theme
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
  Activity
} from 'lucide-react';

const AdminDashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="w-full space-y-3">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
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

  return (
    <MainLayout title="Dashboard" subtitle="Resumen de la plataforma" isAdmin>
      <div className="space-y-6 relative overflow-hidden">
        {/* Ambient light */}
        <div className="absolute top-0 right-0 ambient-blob ambient-blob-orange" style={{ top: '-100px', right: '-50px' }} />
        <div className="absolute bottom-0 left-0 ambient-blob ambient-blob-navy" style={{ bottom: '-100px', left: '-50px' }} />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Total Empleados"
            value={<AnimatedNumber value={totalEmployees} />}
            icon={<Users className="w-6 h-6" />}
            trend={{ value: 12, positive: true }}
            variant="primary"
          />
          <StatCard
            label="Cursos Activos"
            value={<AnimatedNumber value={activeCourses} />}
            icon={<BookOpen className="w-6 h-6" />}
            variant="default"
          />
          <StatCard
            label="Certificados Emitidos"
            value={<AnimatedNumber value={totalCertificates} />}
            icon={<Award className="w-6 h-6" />}
            trend={{ value: 8, positive: true }}
            variant="success"
          />
          <StatCard
            label="Tasa de Completación"
            value={<AnimatedNumber value={completionRate} suffix="%" />}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 5, positive: true }}
            variant="warning"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/documents">
            <Button className="flex items-center gap-2 tap-target-min">
              <Upload className="w-4 h-4" />
              Subir Documento
            </Button>
          </Link>
          <Link to="/admin/courses">
            <Button variant="secondary" className="flex items-center gap-2 tap-target-min">
              <Plus className="w-4 h-4" />
              Crear Curso
            </Button>
          </Link>
          <Link to="/admin/assignments">
            <Button variant="ghost" className="flex items-center gap-2 tap-target-min">
              <FileText className="w-4 h-4" />
              Nueva Asignación
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
          {/* Recent Employees */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Progreso de Empleados</h3>
              <Link to="/admin/employees" className="text-[#D15F3D] hover:text-[#E87A58] text-sm flex items-center gap-1 transition-colors tap-target-min">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentEmployees.length > 0 ? recentEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-4 p-3 glass rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 avatar">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{emp.name}</p>
                    <p className="text-sm text-slate-400">{emp.department}</p>
                  </div>
                  <div className="w-32">
                    <ProgressBar value={emp.progress} size="sm" showLabel />
                  </div>
                </div>
              )) : (
                <EmptyState
                  icon={<Users className="w-8 h-8" />}
                  title="Sin empleados recientes"
                  description="Aún no hay empleados con actividad reciente en la plataforma."
                />
              )}
            </div>
          </Card>

          {/* Course Enrollments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Inscripciones por Curso</h3>
              <Link to="/admin/courses" className="text-[#D15F3D] hover:text-[#E87A58] text-sm flex items-center gap-1 transition-colors tap-target-min">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentCourses.length > 0 ? recentCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 glass rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="w-12 h-12 bg-gradient-modern rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{course.title}</p>
                    <p className="text-sm text-slate-400">{course.enrolled} empleados</p>
                  </div>
                  <Badge variant={course.completion >= 70 ? 'success' : course.completion >= 40 ? 'warning' : 'danger'}>
                    {course.completion}%
                  </Badge>
                </div>
              )) : (
                <EmptyState
                  icon={<BookOpen className="w-8 h-8" />}
                  title="Sin cursos activos"
                  description="Crea y publica cursos para comenzar a ver inscripciones."
                  action={
                    <Link to="/admin/courses">
                      <Button size="sm"><Plus className="w-4 h-4" /> Crear curso</Button>
                    </Link>
                  }
                />
              )}
            </div>
          </Card>
        </div>

        {/* Pending Assignments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Asignaciones Pendientes</h3>
            <Link to="/admin/assignments" className="text-[#D15F3D] hover:text-[#E87A58] text-sm flex items-center gap-1 transition-colors tap-target-min">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Curso</th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Fecha Límite</th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pendingAssignments.length > 0 ? pendingAssignments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <th scope="row" className="px-4 py-3 text-sm text-white font-normal text-left">{a.employeeName}</th>
                    <td className="px-4 py-3 text-sm text-slate-300">{a.courseTitle}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === 'in_progress' ? 'warning' : 'default'}>
                        {a.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-2">
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
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                <div className={`p-2 rounded-xl ${act.icon === 'CheckCircle' ? 'bg-emerald-500/20 text-emerald-400' : act.icon === 'Award' ? 'bg-[#D15F3D]/15 text-[#D15F3D]' : 'bg-amber-500/20 text-amber-400'}`}>
                  {act.icon === 'CheckCircle' && <CheckCircle className="w-4 h-4" />}
                  {act.icon === 'Award' && <Award className="w-4 h-4" />}
                  {act.icon === 'Clock' && <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{act.user} {act.detail}</p>
                  <p className="text-xs text-slate-400">{act.time}</p>
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
    </MainLayout>
  );
};

export default AdminDashboard;
