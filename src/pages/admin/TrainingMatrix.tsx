// Matriz de Capacitaciones — Admin
import React, { useMemo, useState } from 'react';
import { Download, Search, X, Info } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/contexts/CourseContext';
import type { User, Course, CourseAssignment, Certificate } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type CellState = 'completed' | 'in_progress' | 'pending' | 'not_assigned';

interface MatrixCell {
  state: CellState;
  score?: number;     // only when completed
  date?: string;      // only when completed  (dd/mm)
  progress?: number;  // only when in_progress
  assignmentId?: string;
}

interface EmployeeRow {
  user: User;
  cells: Record<string, MatrixCell>; // keyed by courseId
  overallStatus: 'up_to_date' | 'overdue' | 'unassigned';
}

type FilterType = 'all' | 'pending' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
};

const truncate = (text: string, max = 20): string =>
  text.length > max ? text.slice(0, max - 1) + '…' : text;

const cellTitle = (cell: MatrixCell): string => {
  if (cell.state === 'completed') return `Completado: ${cell.score}% — ${cell.date}`;
  if (cell.state === 'in_progress') return `En progreso: ${cell.progress}%`;
  if (cell.state === 'pending') return 'Pendiente de iniciar';
  return 'Curso no asignado';
};

// ─── Cell component ───────────────────────────────────────────────────────────

const MatrixCellView: React.FC<{
  cell: MatrixCell;
  onAssign: () => void;
}> = ({ cell, onAssign }) => {
  const title = cellTitle(cell);

  if (cell.state === 'completed') {
    return (
      <td className="px-3 py-2 text-center bg-emerald-900/40 border border-[#1e2a3a]" title={title}>
        <span className="text-emerald-400 text-xs font-medium whitespace-nowrap">
          ✓ {cell.score}% — {cell.date}
        </span>
      </td>
    );
  }
  if (cell.state === 'in_progress') {
    return (
      <td className="px-3 py-2 text-center bg-blue-900/40 border border-[#1e2a3a]" title={title}>
        <span className="text-blue-300 text-xs font-medium whitespace-nowrap">
          ⏳ {cell.progress}%
        </span>
      </td>
    );
  }
  if (cell.state === 'pending') {
    return (
      <td className="px-3 py-2 text-center bg-amber-900/30 border border-[#1e2a3a]" title={title}>
        <span className="text-amber-400 text-xs font-medium whitespace-nowrap">
          ⚠ Pendiente
        </span>
      </td>
    );
  }
  // not_assigned
  return (
    <td className="px-3 py-2 text-center border border-[#1e2a3a]" title={title}>
      <button
        onClick={onAssign}
        className="tap-target-min inline-flex items-center justify-center text-slate-500 hover:text-[#D15F3D] text-xs transition-colors focus-ring rounded"
        aria-label="Asignar curso"
      >
        —
      </button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#111827] border border-[#1e2a3a] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Asignar curso</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white focus-ring rounded p-1">
            <X size={20} />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-1">
          <span className="font-medium text-white">{employee.name}</span>
        </p>
        <p className="text-slate-400 text-sm mb-6">
          Curso: <span className="text-[#D15F3D] font-medium">{course.title}</span>
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-[#1e2a3a] rounded-lg transition-colors focus-ring"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-[#D15F3D] hover:bg-[#D15F3D]/100 disabled:opacity-50 text-white rounded-lg transition-colors focus-ring"
          >
            {loading ? 'Asignando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const TrainingMatrix: React.FC = () => {
  const { user: adminUser, users } = useAuth();
  const { courses, assignments, certificates, assignCourse } = useCourses();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [assignTarget, setAssignTarget] = useState<{ employee: User; course: Course } | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Breve skeleton mientras se construye la matriz en memoria
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Only published courses
  const publishedCourses = useMemo(
    () => courses.filter((c) => c.status === 'published'),
    [courses]
  );

  // Only employees
  const employees = useMemo(
    () => (users as User[]).filter((u) => u.role === 'employee'),
    [users]
  );

  // Build a lookup: `${userId}-${courseId}` → assignment
  const assignmentMap = useMemo(() => {
    const map: Record<string, CourseAssignment> = {};
    for (const a of assignments) {
      map[`${a.userId}-${a.courseId}`] = a;
    }
    return map;
  }, [assignments]);

  // Build a lookup: `${userId}-${courseId}` → certificate (take highest score)
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

  // Build matrix rows
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

  // Filtered rows
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
    } else if (filter === 'completed') {
      result = result.filter((r) =>
        Object.values(r.cells).every(
          (c) => c.state === 'completed' || c.state === 'not_assigned'
        ) && Object.values(r.cells).some((c) => c.state === 'completed')
      );
    }

    return result;
  }, [rows, search, filter]);

  // Summary stats
  const summary = useMemo(() => {
    const total = rows.length;
    const completedAll = rows.filter((r) => r.overallStatus === 'up_to_date').length;
    const hasPending = rows.filter((r) => r.overallStatus === 'overdue').length;
    const unassigned = rows.filter((r) => r.overallStatus === 'unassigned').length;
    return { total, completedAll, hasPending, unassigned };
  }, [rows]);

  // Export to Excel
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

  // Handle assignment
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
          {/* Summary skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#111827] border border-[#1e2a3a] rounded-xl p-4 text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-24 mx-auto" />
              </div>
            ))}
          </div>
          {/* Toolbar skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          {/* Table skeleton */}
          <div className="overflow-x-auto rounded-xl border border-[#1e2a3a]">
            <Skeleton className="h-96 w-full min-w-[800px]" />
          </div>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total trabajadores', value: summary.total, color: 'text-slate-200' },
              { label: 'Completaron todo', value: summary.completedAll, color: 'text-emerald-400' },
              { label: 'Con pendientes', value: summary.hasPending, color: 'text-amber-400' },
              { label: 'Sin asignaciones', value: summary.unassigned, color: 'text-slate-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-[#111827] border border-[#1e2a3a] rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold ${color}`}>
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o departamento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111827] border border-[#1e2a3a] rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#D15F3D] focus-ring"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 bg-[#111827] border border-[#1e2a3a] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-[#D15F3D] focus-ring"
            >
              <option value="all">Todos los cursos</option>
              <option value="pending">Solo pendientes</option>
              <option value="completed">Solo completados</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#D15F3D] hover:bg-[#B34E2D] text-white text-sm rounded-lg transition-colors focus-ring tap-target-min"
            >
              <Download size={16} />
              Exportar Excel
            </button>
          </div>

          {/* Mobile scroll hint */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 sm:hidden">
            <Info size={14} />
            <span>Desliza horizontalmente para ver todos los cursos</span>
          </div>

          {/* Matrix table */}
          <div className="overflow-x-auto rounded-xl border border-[#1e2a3a] relative">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-[#0D1321]">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-[#0D1321] px-4 py-3 text-left text-slate-300 font-medium border-b border-r border-[#1e2a3a] min-w-[180px]"
                  >
                    Trabajador
                  </th>
                  {publishedCourses.map((course) => (
                    <th
                      key={course.id}
                      scope="col"
                      className="px-3 py-3 text-center text-slate-300 font-medium border-b border-[#1e2a3a] min-w-[140px]"
                      title={course.title}
                    >
                      {truncate(course.title)}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-slate-300 font-medium border-b border-l border-[#1e2a3a] min-w-[110px]"
                  >
                    Estado General
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={publishedCourses.length + 2}
                      className="text-center py-12 text-slate-500"
                    >
                      No se encontraron trabajadores.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr
                      key={row.user.id}
                      className={idx % 2 === 0 ? 'bg-[#111827]' : 'bg-[#0f172a]'}
                    >
                      {/* Sticky employee column */}
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 px-4 py-3 border-r border-[#1e2a3a] text-left font-normal ${
                          idx % 2 === 0 ? 'bg-[#111827]' : 'bg-[#0f172a]'
                        }`}
                      >
                        <p className="text-slate-200 font-medium leading-tight">{row.user.name}</p>
                        {row.user.department && (
                          <p className="text-slate-500 text-xs">{row.user.department}</p>
                        )}
                      </th>

                      {/* Course cells */}
                      {publishedCourses.map((course) => (
                        <MatrixCellView
                          key={course.id}
                          cell={row.cells[course.id] ?? { state: 'not_assigned' }}
                          onAssign={() => setAssignTarget({ employee: row.user, course })}
                        />
                      ))}

                      {/* Overall status */}
                      <td className="px-3 py-2 text-center border-l border-[#1e2a3a]">
                        {row.overallStatus === 'up_to_date' && (
                          <span className="inline-block px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs rounded-full font-medium">
                            Al día
                          </span>
                        )}
                        {row.overallStatus === 'overdue' && (
                          <span className="inline-block px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full font-medium">
                            En atraso
                          </span>
                        )}
                        {row.overallStatus === 'unassigned' && (
                          <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full font-medium">
                            Sin asignar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        </>
      )}
    </MainLayout>
  );
};

export default TrainingMatrix;
