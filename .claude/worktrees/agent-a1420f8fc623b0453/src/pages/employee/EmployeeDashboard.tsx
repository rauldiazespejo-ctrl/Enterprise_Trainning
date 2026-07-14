// Dashboard del Empleado - Modern Dark Theme
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Badge, ProgressBar, Button } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Play,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { courses, assignments, getUserCertificates } = useCourses();

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

  return (
    <MainLayout title="Mi Aprendizaje" subtitle={`Bienvenido, ${user?.name}`} isAdmin={false}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-modern rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">¡Bienvenido de vuelta, {user?.name}!</h2>
            <p className="text-indigo-100 mb-4">Continúa tu aprendizaje y obtén nuevos certificados.</p>
            {nextCourse && (
              <Link to={`/employee/course/${nextCourse.id}`}>
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg">
                  <Play className="w-4 h-4" />
                  Continuar: {nextCourse.title}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCourses}</p>
                <p className="text-sm text-slate-400">Cursos Asignados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedCourses}</p>
                <p className="text-sm text-slate-400">Completados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inProgressCourses}</p>
                <p className="text-sm text-slate-400">En Progreso</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{certificates.length}</p>
                <p className="text-sm text-slate-400">Certificados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Continue Learning */}
        {inProgressList.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Continuar Aprendiendo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressList.map((course) => (
                <Card key={course?.id} className="overflow-hidden group">
                  <div className="h-32 bg-gradient-modern flex items-center justify-center relative">
                    <BookOpen className="w-12 h-12 text-white/30" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
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
              {assignedCourses.filter(c => c?.assignment.status === 'pending').map((course) => (
                <div key={course?.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-12 h-12 bg-gradient-modern rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{course?.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
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
                  <Badge variant="warning">Pendiente</Badge>
                  <Link to={`/employee/course/${course?.id}`}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      Comenzar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}

              {assignedCourses.filter(c => c?.assignment.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No tienes cursos pendientes
                </div>
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
                <Card key={cert.id} className="p-4 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">Certificado de Finalización</h4>
                      <p className="text-sm text-slate-400">
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