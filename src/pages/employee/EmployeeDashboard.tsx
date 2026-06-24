// Dashboard del Empleado - Modern Dark Theme
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Badge, ProgressBar, Button, Skeleton, EmptyState } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Play,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { courses, assignments, getUserCertificates } = useCourses();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simular carga inicial mientras los contextos hidratan datos
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Obtener asignaciones del usuario
  const userAssignments = user ? assignments.filter(a => a.userId === user.id) : [];

  // Obtener cursos asignados
  const assignedCourses = userAssignments.map(a => {
    const course = courses.find(c => c.id === a.courseId);
    return course ? { ...course, assignment: a } : null;
  }).filter(Boolean);

  // Estadísticas
  const totalCourses = assignedCourses.length;
  const completedCourses = assignedCourses.filter(c => c?.assignment.status === 'completed').length;
  const inProgressCourses = assignedCourses.filter(c => c?.assignment.status === 'in_progress').length;
  const certificates = user ? getUserCertificates(user.id) : [];

  // Próximo curso
  const nextCourse = assignedCourses.find(c => c?.assignment.status === 'in_progress');

  // Cursos en progreso
  const inProgressList = assignedCourses.filter(c => c?.assignment.status === 'in_progress');

  // Cursos pendientes
  const pendingCourses = assignedCourses.filter(c => c?.assignment.status === 'pending');

  const renderSkeleton = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome skeleton */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      {/* Courses skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout title="Mi Aprendizaje" subtitle={`Bienvenido, ${user?.name}`} isAdmin={false}>
        {renderSkeleton()}
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Mi Aprendizaje" subtitle={`Bienvenido, ${user?.name}`} isAdmin={false}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl p-6 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0e06 0%, #2d1508 40%, #001B4B 100%)', border: '1px solid rgba(209,95,61,0.25)' }}>
          {/* decorative orbs */}
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(209,95,61,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,27,75,0.4) 0%, transparent 70%)', filter: 'blur(30px)' }} />
          <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs text-[#D15F3D] font-semibold uppercase tracking-widest mb-1">Portal del Empleado</p>
              <h2 className="text-2xl font-bold text-white mb-1">¡Bienvenido, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-400 text-sm">Continúa tu aprendizaje y obtén nuevos certificados.</p>
            </div>
            {nextCourse && (
              <Link to={`/employee/course/${nextCourse.id}`}>
                <Button>
                  <Play className="w-4 h-4" />
                  Continuar curso
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D15F3D]/15 rounded-xl text-[#D15F3D] transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={totalCourses} />
                </p>
                <p className="text-sm text-slate-400">Cursos Asignados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={completedCourses} />
                </p>
                <p className="text-sm text-slate-400">Completados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D15F3D]/15 rounded-xl text-[#D15F3D] transition-transform duration-300 group-hover:scale-110">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={inProgressCourses} />
                </p>
                <p className="text-sm text-slate-400">En Progreso</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 group">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 transition-transform duration-300 group-hover:scale-110">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={certificates.length} />
                </p>
                <p className="text-sm text-slate-400">Certificados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Continue Learning */}
        {inProgressList.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D15F3D]" />
              Continuar Aprendiendo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressList.map((course) => (
                <Card key={course?.id} className="overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D15F3D]/10">
                  <div className="h-32 bg-gradient-modern flex items-center justify-center relative">
                    <BookOpen className="w-12 h-12 text-white/30" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="warning">En Progreso</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-1">{course?.title}</h4>
                    <p className="text-sm text-slate-400 mb-3">
                      {course?.modules?.length || 0} módulos
                    </p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-400">Progreso</span>
                        <span className="font-medium text-white">{course?.assignment.progress || 0}%</span>
                      </div>
                      <ProgressBar value={course?.assignment.progress || 0} />
                    </div>
                    <Link to={`/employee/course/${course?.id}`}>
                      <Button className="w-full">
                        <Play className="w-4 h-4" />
                        Continuar
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Courses */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Cursos Pendientes</h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-700">
              {pendingCourses.map((course) => (
                <div key={course?.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-12 h-12 bg-gradient-modern rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">{course?.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course?.estimatedDuration} min
                      </span>
                      {course?.assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(course.assignment.dueDate).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Badge variant="warning">Pendiente</Badge>
                    <Link to={`/employee/course/${course?.id}`} className="flex-1 sm:flex-initial">
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 w-full sm:w-auto">
                        Comenzar <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {pendingCourses.length === 0 && (
                <EmptyState
                  icon={<BookOpen className="w-8 h-8" />}
                  title="Sin cursos pendientes"
                  description="No tienes cursos pendientes por iniciar."
                />
              )}
            </div>
          </Card>
        </div>

        {/* Recent Certificates */}
        {certificates.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Mis Certificados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.slice(0, 2).map((cert) => (
                <Card key={cert.id} className="p-4 hover:border-[#D15F3D]/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">Certificado de Finalización</h4>
                      <p className="text-sm text-slate-400 truncate">
                        {courses.find(c => c.id === cert.courseId)?.title || 'Curso'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Emitido: {new Date(cert.issuedAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Link to="/employee/certificates">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EmployeeDashboard;
