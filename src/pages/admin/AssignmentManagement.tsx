import React, { useState, useRef, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge, Modal } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCheck, Search, BookOpen, Users, Calendar,
  Plus, Filter, Download, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const APP_URL = 'https://capacita-pro.vercel.app';

const AssignmentManagement: React.FC = () => {
  const { courses, assignments, assignCourse, assignCourseToAll } = useCourses();
  const { user, users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignToAll, setAssignToAll] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const employees = React.useMemo(() => users.filter(u => u.role === 'employee' && u.status !== 'inactive'), [users]);
  const publishedCourses = React.useMemo(() => courses.filter(c => c.status === 'published'), [courses]);

  const userMap = React.useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const courseMap = React.useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);

  const enrichedAssignments = React.useMemo(() => {
    return assignments.map(a => {
      const emp = userMap.get(a.userId);
      const course = courseMap.get(a.courseId);
      return { ...a, employeeName: emp?.name || 'Empleado', courseTitle: course?.title || 'Curso' };
    });
  }, [assignments, userMap, courseMap]);

  const filtered = React.useMemo(() => {
    return enrichedAssignments.filter(a => {
      if (searchTerm && !a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) && !a.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCourse && a.courseId !== filterCourse) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      return true;
    });
  }, [enrichedAssignments, searchTerm, filterCourse, filterStatus]);

  const handleNewAssignment = async () => {
    if (!selectedCourse || !user) return;
    setIsAssigning(true);
    setAssignResult(null);
    try {
      if (assignToAll) {
        const count = await assignCourseToAll(selectedCourse, user.id, employees.map(e => e.id), dueDate ? new Date(dueDate) : undefined);
        setAssignResult(`Curso asignado a ${count} empleado${count !== 1 ? 's' : ''}`);
      } else if (selectedEmployee) {
        await assignCourse(selectedCourse, selectedEmployee, user.id, dueDate ? new Date(dueDate) : undefined);
        setAssignResult('Curso asignado correctamente');
      }
      setTimeout(() => {
        setShowNewModal(false);
        setSelectedCourse('');
        setSelectedEmployee('');
        setAssignToAll(false);
        setDueDate('');
        setAssignResult(null);
      }, 1500);
    } catch (err) {
      setAssignResult('Error al asignar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setIsAssigning(false);
    }
  };

  const downloadQr = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, size, size);
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = 'CapacitaPro-QR-Acceso.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completado</Badge>;
      case 'in_progress': return <Badge variant="warning">En Progreso</Badge>;
      default: return <Badge variant="default">Pendiente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
  };

  return (
    <MainLayout title="Asignaciones" subtitle="Gestiona las asignaciones de cursos" isAdmin>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 stagger-children">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs sm:text-sm text-slate-400">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-slate-500/10 rounded-xl text-slate-400">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs sm:text-sm text-slate-400">Pendientes</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-xs sm:text-sm text-slate-400">En Progreso</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs sm:text-sm text-slate-400">Completados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por empleado o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#D15F3D]/30 focus:border-[#D15F3D] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQrModal(true)} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">QR Acceso</span>
            </Button>
            <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Asignación
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="text-base bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30"
            >
              <option value="">Todos los cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-base bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
          </select>
        </div>

        {/* Assignments — Desktop table / Mobile cards */}
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Sin asignaciones</h3>
              <p className="text-slate-400 mb-4">Crea tu primera asignación de curso</p>
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" /> Nueva Asignación
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Empleado</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Curso</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Asignado</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Fecha Límite</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white font-medium">{a.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{a.courseTitle}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('es-CL') : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-CL') : '—'}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(a.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#D15F3D] rounded-full transition-all"
                                style={{ width: `${a.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{a.progress || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-700/50">
                {filtered.map(a => (
                  <div key={a.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{a.employeeName}</p>
                        <p className="text-sm text-slate-400 truncate">{a.courseTitle}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(a.status)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Asignado: {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('es-CL') : '—'}</span>
                      <span>Límite: {a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-CL') : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(a.status)}
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D15F3D] rounded-full" style={{ width: `${a.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{a.progress || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* New Assignment Modal */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); setAssignResult(null); }} title="Nueva Asignación">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Curso *</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30"
            >
              <option value="">— Seleccionar curso —</option>
              {publishedCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assignToAll}
                onChange={(e) => { setAssignToAll(e.target.checked); setSelectedEmployee(''); }}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-[#D15F3D] focus:ring-[#D15F3D]/30"
              />
              <div>
                <span className="text-white font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D15F3D]" />
                  Asignar a todos los empleados
                </span>
                <p className="text-xs text-slate-400 mt-0.5">{employees.length} empleados activos recibirán el curso</p>
              </div>
            </label>
          </div>

          {!assignToAll && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Empleado *</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30"
              >
                <option value="">— Seleccionar empleado —</option>
                {employees.map(e => {
                  const alreadyAssigned = selectedCourse ? assignments.some(a => a.userId === e.id && a.courseId === selectedCourse) : false;
                  return (
                    <option key={e.id} value={e.id} disabled={alreadyAssigned}>
                      {e.name}{alreadyAssigned ? ' (ya asignado)' : ''} — {e.department || 'Sin depto.'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30"
            />
          </div>

          {assignResult && (
            <div className={`p-3 rounded-xl text-sm ${assignResult.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
              {assignResult}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowNewModal(false); setAssignResult(null); }}>Cancelar</Button>
            <Button
              onClick={handleNewAssignment}
              disabled={!selectedCourse || (!assignToAll && !selectedEmployee) || isAssigning}
            >
              {isAssigning ? 'Asignando...' : assignToAll ? `Asignar a ${employees.length} empleados` : 'Asignar Curso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="QR de Acceso — CapacitaPro">
        <div className="space-y-4">
          <p className="text-sm text-slate-400 text-center">
            Los empleados pueden escanear este QR para acceder directamente a la plataforma desde su celular.
          </p>
          <div ref={qrRef} className="flex justify-center p-6 bg-white rounded-2xl mx-auto" style={{ width: 'fit-content' }}>
            <QRCodeSVG
              value={APP_URL}
              size={240}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0a0d14"
            />
          </div>
          <p className="text-center text-xs text-slate-500 font-mono">{APP_URL}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowQrModal(false)}>Cerrar</Button>
            <Button onClick={downloadQr}>
              <Download className="w-4 h-4" /> Descargar QR (PNG)
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default AssignmentManagement;
