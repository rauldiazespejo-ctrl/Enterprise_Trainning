// Dashboard del Administrador - Modern Dark Theme
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, StatCard, Button, Badge, ProgressBar } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import { db } from '@/lib/supabase';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  Upload,
  ArrowRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const { data } = await db.getStats();
      if (mounted && data) {
        setStats(data);
        setLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  if (loading || !stats) {
    return (
      <MainLayout title="Dashboard" subtitle="Resumen de la plataforma" isAdmin>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </MainLayout>
    );
  }

  const { totalEmployees, activeCourses, totalAssignments, totalCertificates, completionRate, recentEmployees, recentCourses, recentActivity } = stats;

  return (
    <MainLayout title="Dashboard" subtitle="Resumen de la plataforma" isAdmin>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Empleados"
            value={totalEmployees}
            icon={<Users className="w-6 h-6" />}
            trend={{ value: 12, positive: true }}
            variant="primary"
          />
          <StatCard
            label="Cursos Activos"
            value={activeCourses}
            icon={<BookOpen className="w-6 h-6" />}
            variant="default"
          />
          <StatCard
            label="Certificados Emitidos"
            value={totalCertificates}
            icon={<Award className="w-6 h-6" />}
            trend={{ value: 8, positive: true }}
            variant="success"
          />
          <StatCard
            label="Tasa de Completación"
            value={`${completionRate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 5, positive: true }}
            variant="warning"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/documents">
            <Button className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Subir Documento
            </Button>
          </Link>
          <Link to="/admin/courses">
            <Button variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Curso
            </Button>
          </Link>
          <Link to="/admin/assignments">
            <Button variant="ghost" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nueva Asignación
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Employees */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Progreso de Empleados</h3>
              <Link to="/admin/employees" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentEmployees.map((emp) => (
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
              ))}
            </div>
          </Card>

          {/* Course Enrollments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Inscripciones por Curso</h3>
              <Link to="/admin/courses" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentCourses.map((course) => (
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
              ))}
            </div>
          </Card>
        </div>

        {/* Pending Assignments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Asignaciones Pendientes</h3>
            <Link to="/admin/assignments" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Curso</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Fecha Límite</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">María García</td>
                  <td className="px-4 py-3 text-sm text-slate-300">Fundamentos de Gestión</td>
                  <td className="px-4 py-3 text-sm text-slate-400">15 Mar 2026</td>
                  <td className="px-4 py-3">
                    <Badge variant="warning">En Progreso</Badge>
                  </td>
                </tr>
                <tr className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">Juan Pérez</td>
                  <td className="px-4 py-3 text-sm text-slate-300">Comunicación Efectiva</td>
                  <td className="px-4 py-3 text-sm text-slate-400">20 Mar 2026</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">Pendiente</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">Ana Martínez</td>
                  <td className="px-4 py-3 text-sm text-slate-300">Liderazgo y Motivación</td>
                  <td className="px-4 py-3 text-sm text-slate-400">25 Mar 2026</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">Completado</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

                {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivity && recentActivity.map((act: any) => (
              <div key={act.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                <div className={`p-2 rounded-xl ${act.icon === 'CheckCircle' ? 'bg-emerald-500/20 text-emerald-400' : act.icon === 'Award' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {act.icon === 'CheckCircle' && <CheckCircle className="w-4 h-4" />}
                  {act.icon === 'Award' && <Award className="w-4 h-4" />}
                  {act.icon === 'Clock' && <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{act.user} {act.detail}</p>
                  <p className="text-xs text-slate-400">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;