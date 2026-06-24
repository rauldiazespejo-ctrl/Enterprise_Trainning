// Matriz de Capacitaciones — Admin (Heatmap)
import React, { useMemo, useState } from 'react';
import { Download, Search, X, Info, Check, Clock, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton, Badge } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import type { User, Course, CourseAssignment, Certificate } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type CellState = 'completed' | 'in_progress' | 'pending' | 'overdue' | 'not_assigned';

interface MatrixCell {
  state: CellState;
  score?: number;
  date?: string;
  progress?: number;
  assignmentId?: string;
}

interface EmployeeRow {
  user: User;
  cells: Record<string, MatrixCell>;
  overallStatus: 'up_to_date' | 'overdue' | 'unassigned';
}

type FilterType = 'all' | 'pending' | 'overdue' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
};

const truncate = (text: string, max = 22): string =>
  text.length > max ? text.slice(0, max - 1) + '…' : text;

const isOverdue = (assignment: CourseAssignment): boolean => {
  if (!assignment.dueDate) return false;
  return new Date(assignment.dueDate) < new Date();
};

const cellDetail = (cell: MatrixCell): { label: string; score?: number; date?: string } => {
  if (cell.state === 'completed') return { label: `Completado: ${cell.score}% — ${cell.date}`, score: cell.score, date: cell.date };
  if (cell.state === 'in_progress') return { label: `En progreso: ${cell.progress}%` };
  if (cell.state === 'pending') return { label: 'Pendiente de iniciar' };
  if (cell.state === 'overdue') return { label: 'Vencido' };
  return { label: 'Curso no asignado' };
};

// ─── Heatmap cell ─────────────────────────────────────────────────────────────

const HeatmapCell: React.FC<{
  cell: MatrixCell;
  course: Course;
  employee: User;
  onAssign: () => void;
}> = ({ cell, course, employee, onAssign }) => {
  const detail = cellDetail(cell);
  const stateClass = `heatmap-${cell.state}`;

  const icon =
    cell.state === 'completed' ? <Check className="w-4 h-4" /> :
    cell.state === 'in_progress' ? <Clock className="w-4 h-4" /> :
    cell.state === 'pending' ? <AlertTriangle className="w-4 h-4" /> :
    cell.state === 'overdue' ? <AlertCircle className="w-4 h-4" /> :
    <Plus className="w-4 h-4" />;

  const label = `${employee.name} — ${course.title}: ${detail.label}`;

  return (
    <td className="p-1">
      <Tooltip.Root delayDuration={150}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={cell.state === 'not_assigned' ? onAssign : undefined}
            className={`heatmap-cell ${stateClass} tap-target-min focus-ring`}
            aria-label={label}
          >
            {icon}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="center"
            sideOffset={6}
            className="z-50 max-w-xs rounded-xl bg-popover border border-border p-3 shadow-xl text-sm"
          >
            <p className="font-semibold text-foreground truncate">{employee.name}</p>
            <p className="text-xs text-muted-foreground truncate">{course.title}</p>
            <p className="text-xs text-foreground mt-1.5">{detail.label}</p>
            {detail.score !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">Score: {detail.score}%</p>
            )}
            {detail.date && (
              <p className="text-xs text-muted-foreground mt-1">Fecha: {detail.date}</p>
            )}
            <Tooltip.Arrow className="fill-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </td>
  );
};

// ─── Assign modal ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  employee: User;
  course: Course;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

const AssignModal: React.FC<AssignModalProps> = ({ employee, course, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-foreground font-semibold text-lg">Asignar curso</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground focus-ring rounded-lg p-1 tap-target-min"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-foreground text-sm mb-1">
          <span className="font-medium">{employee.name}</span>
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          Curso: <span className="text-brand font-medium">{course.title}</span>
        </p>
        {error && (
          <p className="text-destructive text-sm mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors focus-ring tap-target-min"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors focus-ring tap-target-min"
          >
            {loading ? 'Asignando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Legend ───────────────────────────────────────────────────────────────────

const Legend: React.FC = () => (
  <aside className="w-full lg:w-52 shrink-0">
    <div className="bg-card border border-border rounded-xl p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        Leyenda
      </h4>
      <ul className="space-y-2.5">
        {[
          { cls: 'heatmap-completed', label: 'Completado', icon: Check },
          { cls: 'heatmap-in_progress', label: 'En progreso', icon: Clock },
          { cls: 'heatmap-pending', label: 'Pendiente', icon: AlertTriangle },
          { cls: 'heatmap-overdue', label: 'Vencido', icon: AlertCircle },
          { cls: 'heatmap-not_assigned', label: 'No asignado', icon: Plus },
        ].map(({ cls, label, icon: Icon }) => (
          <li key={cls} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className={`heatmap-cell ${cls} !w-6 !h-6 !min-w-[24px] rounded-md`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const TrainingMatrix: React.FC = () => {
  const { user: adminUser, users } = useAuth();
  const { courses, assignments, certificates, assignCourse } = useCourses();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [assignTarget, setAssignTarget] = useState<{ employee: User; course: Course } | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const publishedCourses = useMemo(
    () => courses.filter((c) => c.status === 'published'),
    [courses]
  );

  const employees = useMemo(
    () => (users as User[]).filter((u) => u.role === 'employee'),
    [users]
  );

  const assignmentMap = useMemo(() => {
    const map: Record<string, CourseAssignment> = {};
    for (const a of assignments) {
      map[`${a.userId}-${a.courseId}`] = a;
    }
    return map;
  }, [assignments]);

  const certMap = useMemo(() => {
    const map: Record<string, Certificate> = {};
    for (const c of certificates) {
      const key = `${c.userId}-${c.courseId}`;
      if (!map[key] || c.score > map[key].score) {
        map[key] = c;
      }
    }
    return map;
  }, [certificates]);

  const rows: EmployeeRow[] = useMemo(() => {
    return employees.map((emp) => {
      const cells: Record<string, MatrixCell> = {};
      let assignedCount = 0;
      let hasPending = false;

      for (const course of publishedCourses) {
        const key = `${emp.id}-${course.id}`;
        const assignment = assignmentMap[key];
        const cert = certMap[key];

        if (!assignment) {
          cells[course.id] = { state: 'not_assigned' };
          continue;
        }

        assignedCount++;

        if (assignment.status === 'completed' || cert) {
          const score = cert?.score ?? 100;
          const completedDate = cert?.completedAt ?? assignment.completedAt;
          cells[course.id] = {
            state: 'completed',
            score,
            date: completedDate ? fmt(new Date(completedDate)) : '—',
            assignmentId: assignment.id,
          };
        } else if (assignment.status === 'in_progress' || assignment.progress > 0) {
          cells[course.id] = {
            state: 'in_progress',
            progress: assignment.progress,
            assignmentId: assignment.id,
          };
          hasPending = true;
        } else if (isOverdue(assignment)) {
          cells[course.id] = { state: 'overdue', assignmentId: assignment.id };
          hasPending = true;
        } else {
          cells[course.id] = { state: 'pending', assignmentId: assignment.id };
          hasPending = true;
        }
      }

      let overallStatus: EmployeeRow['overallStatus'];
      if (assignedCount === 0) {
        overallStatus = 'unassigned';
      } else if (hasPending) {
        overallStatus = 'overdue';
      } else {
        overallStatus = 'up_to_date';
      }

      return { user: emp, cells, overallStatus };
    });
  }, [employees, publishedCourses, assignmentMap, certMap]);

  const filteredRows = useMemo(() => {
    let result = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.user.name.toLowerCase().includes(q) ||
          (r.user.department ?? '').toLowerCase().includes(q)
      );
    }

    if (filter === 'pending') {
      result = result.filter((r) =>
        Object.values(r.cells).some(
          (c) => c.state === 'pending' || c.state === 'in_progress'
        )
      );
    } else if (filter === 'overdue') {
      result = result.filter((r) =>
        Object.values(r.cells).some((c) => c.state === 'overdue')
      );
    } else if (filter === 'completed') {
      result = result.filter(
        (r) =>
          Object.values(r.cells).every(
            (c) => c.state === 'completed' || c.state === 'not_assigned'
          ) && Object.values(r.cells).some((c) => c.state === 'completed')
      );
    }

    return result;
  }, [rows, search, filter]);

  const summary = useMemo(() => {
    const total = rows.length;
    const completedAll = rows.filter((r) => r.overallStatus === 'up_to_date').length;
    const hasPending = rows.filter((r) => r.overallStatus === 'overdue').length;
    const unassigned = rows.filter((r) => r.overallStatus === 'unassigned').length;
    return { total, completedAll, hasPending, unassigned };
  }, [rows]);

  const handleExport = async () => {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matriz');

    const headers = [
      'Trabajador',
      'Departamento',
      ...publishedCourses.map((c) => truncate(c.title, 30)),
      'Estado General',
    ];
    worksheet.addRow(headers);

    rows.forEach((row) => {
      const courseCols = publishedCourses.map((c) => {
        const cell = row.cells[c.id];
        if (!cell) return '—';
        if (cell.state === 'completed') return `✓ ${cell.score}% — ${cell.date}`;
        if (cell.state === 'in_progress') return `En progreso ${cell.progress}%`;
        if (cell.state === 'pending') return 'Pendiente';
        if (cell.state === 'overdue') return 'Vencido';
        return '—';
      });

      const status =
        row.overallStatus === 'up_to_date'
          ? 'Al día'
          : row.overallStatus === 'overdue'
          ? 'En atraso'
          : 'Sin asignar';

      worksheet.addRow([row.user.name, row.user.department ?? '', ...courseCols, status]);
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `matriz_capacitaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleAssign = async (employee: User, course: Course) => {
    if (!adminUser) return;
    await assignCourse(course.id, employee.id, adminUser.id);
  };

  return (
    <MainLayout
      title="Matriz de Capacitaciones"
      subtitle="Estado de cumplimiento por trabajador"
      isAdmin
    >
      {loading ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Skeleton className="h-96 w-full min-w-[800px]" />
          </div>
        </div>
      ) : (
        <Tooltip.Provider delayDuration={150}>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total trabajadores', value: summary.total, color: 'text-foreground' },
              { label: 'Completaron todo', value: summary.completedAll, color: 'text-emerald-500' },
              { label: 'Con pendientes', value: summary.hasPending, color: 'text-accent' },
              { label: 'Sin asignaciones', value: summary.unassigned, color: 'text-muted-foreground' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold ${color}`}>
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-muted-foreground text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre o departamento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus-ring"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-ring focus-ring"
            >
              <option value="all">Todos los cursos</option>
              <option value="pending">Solo pendientes</option>
              <option value="overdue">Solo vencidos</option>
              <option value="completed">Solo completados</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg transition-colors focus-ring tap-target-min"
            >
              <Download size={16} />
              Exportar Excel
            </button>
          </div>

          {/* Heatmap + legend */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0 overflow-x-auto rounded-xl border border-border relative">
              {/* Mobile scroll hint */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 sm:hidden border-b border-border/50">
                <Info size={14} />
                <span>Desliza horizontalmente para ver todos los cursos</span>
              </div>

              <table className="border-separate border-spacing-1 min-w-max w-full">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-30 bg-background px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[180px]"
                    >
                      Trabajador
                    </th>
                    {publishedCourses.map((course) => (
                      <th
                        key={course.id}
                        scope="col"
                        className="bg-muted/50 border-b border-border min-w-[52px]"
                        title={course.title}
                      >
                        <div className="heatmap-header">
                          <span>{truncate(course.title, 28)}</span>
                        </div>
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="bg-muted/50 border-b border-border px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[110px]"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={publishedCourses.length + 2}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No se encontraron trabajadores.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.user.id}>
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-background px-4 py-2 border-b border-border text-left font-normal min-w-[180px]"
                        >
                          <p className="text-foreground font-medium leading-tight">{row.user.name}</p>
                          {row.user.department && (
                            <p className="text-muted-foreground text-xs">{row.user.department}</p>
                          )}
                        </th>

                        {publishedCourses.map((course) => (
                          <HeatmapCell
                            key={course.id}
                            cell={row.cells[course.id] ?? { state: 'not_assigned' }}
                            course={course}
                            employee={row.user}
                            onAssign={() => setAssignTarget({ employee: row.user, course })}
                          />
                        ))}

                        <td className="px-3 py-2 text-center border-b border-border">
                          {row.overallStatus === 'up_to_date' && (
                            <Badge variant="success">Al día</Badge>
                          )}
                          {row.overallStatus === 'overdue' && (
                            <Badge variant="danger">En atraso</Badge>
                          )}
                          {row.overallStatus === 'unassigned' && (
                            <Badge variant="default">Sin asignar</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Legend />
          </div>

          {/* Assign modal */}
          {assignTarget && (
            <AssignModal
              employee={assignTarget.employee}
              course={assignTarget.course}
              onConfirm={() => handleAssign(assignTarget.employee, assignTarget.course)}
              onClose={() => setAssignTarget(null)}
            />
          )}
        </Tooltip.Provider>
      )}
    </MainLayout>
  );
};

export default TrainingMatrix;
