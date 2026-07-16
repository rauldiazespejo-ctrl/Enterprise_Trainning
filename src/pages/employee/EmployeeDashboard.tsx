// EmployeeDashboard — tarjetas premium, hero animado y progreso circular
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Badge, ProgressBar, Button, Skeleton, EmptyState } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import {
  BookOpen, Award, Clock, CheckCircle, Play, Calendar, Sparkles, ArrowRight,
  TrendingUp, Flame, Target
} from 'lucide-react';

// ─── Progreso circular SVG ───────────────────────────────────────────────────

const CircularProgress: React.FC<{ value: number; size?: number; stroke?: number }> = ({ value, size = 64, stroke = 6 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#circleGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{Math.round(pct)}%</span>
    </div>
  );
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { courses, assignments, getUserCertificates } = useCourses();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const assignedCourses = React.useMemo(() => {
    if (!user) return [];
    // ⚡ Bolt: Convert O(N) array find to O(1) Map lookup and memoize
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return assignments
      .filter(a => a.userId === user.id)
      .map(a => {
        const course = courseMap.get(a.courseId);
        return course ? { ...course, assignment: a } : null;
      })
      .filter(Boolean);
  }, [user, assignments, courses]);

  const {
    totalCourses,
    completedCourses,
    inProgressCourses,
    nextCourse,
    inProgressList,
    pendingCourses,
    completionPct
  } = React.useMemo(() => {
    const total = assignedCourses.length;
    const inProgList = assignedCourses.filter(c => c?.assignment.status === 'in_progress');
    const pendList = assignedCourses.filter(c => c?.assignment.status === 'pending');
    const completed = assignedCourses.filter(c => c?.assignment.status === 'completed').length;

    return {
      totalCourses: total,
      completedCourses: completed,
      inProgressCourses: inProgList.length,
      nextCourse: inProgList.length > 0 ? inProgList[0] : undefined,
      inProgressList: inProgList,
      pendingCourses: pendList,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [assignedCourses]);

  const certificates = React.useMemo(() => {
    return user ? getUserCertificates(user.id) : [];
  }, [user, getUserCertificates]);

  const stats = React.useMemo(() => [
    { label: 'Cursos Asignados', value: totalCourses, icon: BookOpen, color: 'bg-primary/15 text-primary' },
    { label: 'Completados', value: completedCourses, icon: CheckCircle, color: 'bg-emerald-500/15 text-emerald-500' },
    { label: 'En Progreso', value: inProgressCourses, icon: Clock, color: 'bg-accent/15 text-accent' },
    { label: 'Certificados', value: certificates.length, icon: Award, color: 'bg-secondary/15 text-secondary' },
  ], [totalCourses, completedCourses, inProgressCourses, certificates.length]);

  const renderSkeleton = () => (
    <div className="space-y-6 animate-fadeIn">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
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
      <div className="space-y-8">
        {/* Hero banner animado */}
        <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-primary-foreground overflow-hidden animate-hero-gradient bg-[length:200%_200%]"
          style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 40%, hsl(var(--accent)) 100%)' }}>
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none bg-black/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Portal del Empleado
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                ¡Hola, {user?.name?.split(' ')[0]}!
              </h2>
              <p className="text-white/85 text-base md:text-lg">
                {completionPct >= 75
                  ? 'Excelente ritmo. Sigue así y completa tu plan de capacitación.'
                  : completionPct >= 40
                    ? 'Vas avanzando. Continúa con tu próximo curso asignado.'
                    : 'Es un buen momento para comenzar tu aprendizaje.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <Target className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{completionPct}% plan completado</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <Flame className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-medium">{inProgressCourses} en progreso</span>
                </div>
              </div>
            </div>

            {nextCourse && (
              <Link to={`/employee/course/${nextCourse.id}`} className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl px-6 py-4 text-base tap-target-min">
                  <Play className="w-5 h-5" />
                  Continuar curso
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats rounded cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-5 group rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${stat.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <stat.icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* In progress horizontal cards */}
        {inProgressList.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
              Continuar Aprendiendo
            </h3>
            <div className="space-y-4 stagger-children">
              {inProgressList.map((course) => (
                <Card key={course?.id} className="overflow-hidden p-0 rounded-2xl group">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-32 md:h-auto bg-gradient-modern flex items-center justify-center relative shrink-0">
                      <BookOpen className="w-14 h-14 text-primary-foreground/30" aria-hidden="true" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-3 left-3">
                        <Badge variant="warning">En Progreso</Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-foreground mb-1">{course?.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {course?.modules?.length || 0} módulos • {course?.estimatedDuration} min estimados
                        </p>
                        <div className="w-full md:max-w-md">
                          <ProgressBar value={course?.assignment.progress || 0} showLabel />
                        </div>
                      </div>
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <CircularProgress value={course?.assignment.progress || 0} size={72} stroke={7} />
                        <Link to={`/employee/course/${course?.id}`} className="flex-1 md:flex-initial">
                          <Button className="whitespace-nowrap tap-target-min w-full md:w-auto">
                            <Play className="w-4 h-4" />
                            Continuar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending courses visual checklist */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">Cursos Pendientes</h3>
          <Card className="overflow-hidden rounded-2xl p-0">
            <div className="divide-y divide-border">
              {pendingCourses.map((course) => (
                <div key={course?.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-muted/40 transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <div className="w-5 h-5 rounded-md border-2 border-muted-foreground/40 group-hover:border-primary group-hover:bg-primary transition-colors flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{course?.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {course?.estimatedDuration} min
                      </span>
                      {course?.assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          {new Date(course.assignment.dueDate).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Badge variant="warning">Pendiente</Badge>
                    <Link to={`/employee/course/${course?.id}`} className="flex-1 sm:flex-initial">
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 w-full sm:w-auto tap-target-min">
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

        {/* Certificates credential style */}
        {certificates.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" aria-hidden="true" />
              Mis Certificados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
              {certificates.slice(0, 4).map((cert) => (
                <Card key={cert.id} className="p-0 overflow-hidden rounded-2xl hover:border-primary/50 transition-colors group">
                  <div className="flex">
                    <div className="w-24 shrink-0 bg-gradient-to-br from-accent via-primary to-secondary flex flex-col items-center justify-center text-primary-foreground relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10" />
                      <Award className="w-10 h-10 mb-1 relative z-10" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">Cert</span>
                    </div>
                    <div className="flex-1 p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">Certificado de Finalización</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {courses.find(c => c.id === cert.courseId)?.title || 'Curso'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Emitido: {new Date(cert.issuedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Link to="/employee/certificates">
                        <Button variant="ghost" size="sm" className="tap-target-min">
                          Ver
                        </Button>
                      </Link>
                    </div>
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
