// Gestión de Empleados - Página del Administrador
import React, { useRef, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge, Modal } from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { downloadCredentialsCsv, EmployeeImportRow, parseEmployeeWorkbook, employeeEmailFromRut, isValidRut, normalizeRut, rutBodyNoDv } from '@/lib/employeeImport';
import {
  Plus,
  Search,
  Users,
  Award,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle,
  Upload,
  KeyRound,
  Loader2
} from 'lucide-react';

interface EmployeeForm {
  name: string;
  rut: string;
  email: string;
  department: string;
  position: string;
  password: string;
  status: 'active' | 'inactive';
}

const emptyForm: EmployeeForm = {
  name: '',
  rut: '',
  email: '',
  department: '',
  position: '',
  password: '',
  status: 'active'
};

const defaultStats = { completed: 0, inProgress: 0, certificates: 0 };

const EmployeeManagement: React.FC = () => {
  const { courses, assignments, certificates, assignCourse } = useCourses();
  const { user, users, addUser, updateUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<EmployeeImportRow[]>([]);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showResetRutModal, setShowResetRutModal] = useState(false);
  const [isResettingRut, setIsResettingRut] = useState(false);
  const [resetRutResult, setResetRutResult] = useState<{ updated: number; skipped: number; results: any[] } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const employees = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

  const statsMap = useMemo(() => {
    const map = new Map<string, { completed: number; inProgress: number; certificates: number }>();

    // Initialize map with employees
    employees.forEach(emp => {
      map.set(emp.id, { completed: 0, inProgress: 0, certificates: 0 });
    });

    // Aggregate assignments
    assignments.forEach(a => {
      const stats = map.get(a.userId);
      if (stats) {
        if (a.status === 'completed') stats.completed++;
        if (a.status === 'in_progress') stats.inProgress++;
      }
    });

    // Aggregate certificates
    certificates.forEach(c => {
      const stats = map.get(c.userId);
      if (stats) {
        stats.certificates++;
      }
    });

    return map;
  }, [employees, assignments, certificates]);

  const filteredEmployees = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(lowerSearch) ||
      emp.email.toLowerCase().includes(lowerSearch) ||
      (emp.rut || '').toLowerCase().includes(lowerSearch) ||
      (emp.department || '').toLowerCase().includes(lowerSearch)
    );
  }, [employees, searchTerm]);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (employee: User) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      rut: employee.rut || '',
      email: employee.email,
      department: employee.department || '',
      position: employee.position || '',
      password: '',
      status: employee.status || 'active'
    });
    setFormError('');
    setShowFormModal(true);
  };

  const saveEmployee = async () => {
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    // Derivar email y contraseña del RUT si se proporcionó
    const rutClean = normalizeRut(form.rut.trim());
    const rutProvided = form.rut.trim().length > 0;
    if (rutProvided && !isValidRut(rutClean)) {
      setFormError('El RUT ingresado no es válido. Ej: 15422822-5 o 154228225');
      return;
    }
    const derivedEmail = rutProvided ? employeeEmailFromRut(rutClean) : form.email.trim();
    const derivedPassword = rutProvided ? rutBodyNoDv(rutClean) : form.password.trim();

    if (!derivedEmail) {
      setFormError('Ingresa un RUT o un correo electrónico');
      return;
    }

    if (editingId) {
      const updates: Partial<User> = {
        name: form.name.trim(),
        rut: form.rut.trim() || undefined,
        email: derivedEmail,
        department: form.department.trim() || undefined,
        position: form.position.trim() || undefined,
        status: form.status
      };
      await updateUser(editingId, updates);
    } else {
      const result = await addUser({
        name: form.name.trim(),
        rut: form.rut.trim() || undefined,
        email: derivedEmail,
        role: 'employee',
        department: form.department.trim() || undefined,
        position: form.position.trim() || undefined,
        password: derivedPassword,
        status: form.status,
        avatar: ''
      });
      if (!result.success) {
        setFormError(result.error || 'No se pudo crear el empleado');
        return;
      }
    }

    setShowFormModal(false);
  };

  const confirmDelete = async () => {
    if (selectedEmployee) {
      await deleteUser(selectedEmployee.id);
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleAssignCourse = (employee: User) => {
    setSelectedEmployee(employee);
    setSelectedCourse('');
    setShowAssignModal(true);
  };

  const confirmAssignment = () => {
    if (selectedEmployee && selectedCourse && user) {
      const alreadyAssigned = assignments.some(
        a => a.userId === selectedEmployee.id && a.courseId === selectedCourse
      );
      if (!alreadyAssigned) {
        assignCourse(selectedCourse, selectedEmployee.id, user.id);
      }
      setShowAssignModal(false);
      setSelectedEmployee(null);
      setSelectedCourse('');
    }
  };

  const handleImportFile = async (file: File) => {
    setImportError('');
    try {
      const rows = await parseEmployeeWorkbook(file);
      setImportRows(rows);
      setShowImportModal(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo leer el archivo.');
      setImportRows([]);
      setShowImportModal(true);
    }
  };

  const confirmImport = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    setImportError('');
    try {
      if (import.meta.env.DEV) {
        const credentials = await Promise.all(importRows.map(async row => {
          const password = row.password;
          await addUser({
            rut: row.rut,
            name: row.name,
            email: row.email,
            role: 'employee',
            department: row.department,
            position: row.position,
            password,
            status: 'active',
            avatar: ''
          });
          return { rut: row.rut, name: row.name, email: row.email, password };
        }));
        downloadCredentialsCsv(credentials);
      } else {
        const { data, error } = await supabase.functions.invoke('import-workers', { body: { workers: importRows } });
        if (error) throw error;
        downloadCredentialsCsv(data.credentials);
      }
      setShowImportModal(false);
      setImportRows([]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No se pudo completar la importación.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetAllToRut = async () => {
    setIsResettingRut(true);
    setResetRutResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        body: { action: 'reset_all_to_rut' }
      });
      if (error) throw error;
      setResetRutResult(data);
    } catch (err) {
      setResetRutResult({ updated: 0, skipped: 0, results: [{ name: 'Error', rut: '', email: '', status: err instanceof Error ? err.message : 'Error inesperado' }] });
    } finally {
      setIsResettingRut(false);
    }
  };

  const totalCompleted = useMemo(() => {
    return employees.reduce((sum, e) => sum + (statsMap.get(e.id)?.completed || 0), 0);
  }, [employees, statsMap]);

  const totalInTraining = useMemo(() => {
    return employees.filter(e => (statsMap.get(e.id)?.inProgress || 0) > 0).length;
  }, [employees, statsMap]);

  return (
    <MainLayout title="Gestión de Empleados" subtitle="Administra usuarios y asigna cursos" isAdmin>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{employees.length}</p>
                <p className="text-sm text-slate-400">Total Empleados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalInTraining}</p>
                <p className="text-sm text-slate-400">En Capacitación</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/10 rounded-lg text-brand">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCompleted}</p>
                <p className="text-sm text-slate-400">Cursos Completados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{certificates.length}</p>
                <p className="text-sm text-slate-400">Certificados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empleados por nombre, correo o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImportFile(file);
                event.target.value = '';
              }}
            />
            <Button variant="outline" onClick={() => setShowResetRutModal(true)}>
              <KeyRound className="w-4 h-4" />
              Restablecer accesos
            </Button>
            <Button variant="outline" onClick={() => importInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Importar Excel
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4" />
              Agregar Empleado
            </Button>
          </div>
        </div>

        {/* Employees Table */}
        <Card className="overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {employees.length === 0 ? 'No hay empleados registrados' : 'Sin resultados'}
              </h3>
              <p className="text-slate-500">
                {employees.length === 0
                  ? 'Agrega tu primer empleado para empezar a asignar cursos.'
                  : 'Intenta con otro término de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Empleado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Cursos</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Certificados</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((employee) => {
                    const stats = statsMap.get(employee.id) || defaultStats;
                    return (
                      <tr key={employee.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand to-[#001B4B] rounded-full flex items-center justify-center text-white font-semibold">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{employee.name}</p>
                              <p className="text-sm text-slate-400">{employee.email}</p>
                              {employee.rut && <p className="text-xs text-slate-400">RUT: {employee.rut}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{employee.department || '—'}</p>
                            <p className="text-sm text-slate-400">{employee.position || ''}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-emerald-500/15 text-emerald-400 rounded text-xs">
                              {stats.completed} completados
                            </span>
                            <span className="px-2 py-1 bg-blue-500/15 text-blue-400 rounded text-xs">
                              {stats.inProgress} en progreso
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Award className="w-4 h-4" />
                            <span>{stats.certificates}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={employee.status === 'inactive' ? 'warning' : 'success'}>
                            {employee.status === 'inactive' ? 'Inactivo' : 'Activo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignCourse(employee)}
                            >
                              <BookOpen className="w-4 h-4" />
                              Asignar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditModal(employee)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredEmployees.length > PAGE_SIZE && (
            <div className="px-6 py-4 border-t border-slate-700/50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredEmployees.length}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Assign Course Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Asignar Curso"
      >
        <div className="space-y-4">
          {selectedEmployee && (
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="font-medium text-white">{selectedEmployee.name}</p>
              <p className="text-sm text-slate-500">{selectedEmployee.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Seleccionar Curso</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
            >
              <option value="">-- Seleccionar curso --</option>
              {courses.filter(c => c.status === 'published').map(course => {
                const alreadyAssigned = selectedEmployee
                  ? assignments.some(a => a.userId === selectedEmployee.id && a.courseId === course.id)
                  : false;
                return (
                  <option key={course.id} value={course.id} disabled={alreadyAssigned}>
                    {course.title}{alreadyAssigned ? ' (ya asignado)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmAssignment} disabled={!selectedCourse}>
              Asignar Curso
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Employee Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingId ? 'Editar Empleado' : 'Agregar Empleado'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 outline-none"
              placeholder="Ej. María García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">RUT *</label>
            <input
              type="text"
              value={form.rut}
              onChange={(e) => {
                const rut = e.target.value;
                const clean = normalizeRut(rut);
                const valid = isValidRut(clean);
                setForm({
                  ...form,
                  rut,
                  email: valid ? employeeEmailFromRut(clean) : form.email,
                  password: valid ? rutBodyNoDv(clean) : form.password
                });
              }}
              className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 outline-none font-mono"
              placeholder="Ej. 15422822-5 o 154228225"
            />
            {form.rut && isValidRut(normalizeRut(form.rut)) && (
              <p className="text-xs text-emerald-600 mt-1">
                Acceso: <span className="font-mono">{normalizeRut(form.rut).replace(/\./g, '').replace('-', '')}</span>
                {' '}/ Clave inicial: <span className="font-mono">{rutBodyNoDv(normalizeRut(form.rut))}</span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Departamento</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 outline-none"
                placeholder="Ventas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Puesto</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 outline-none"
                placeholder="Ejecutivo"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-4 py-2 bg-slate-800 text-white text-base border border-slate-600 rounded-lg focus:ring-2 focus:ring-brand/30 outline-none"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveEmployee()}>
              {editingId ? 'Guardar Cambios' : 'Crear Empleado'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Empleado"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Seguro que deseas eliminar a <span className="font-semibold">{selectedEmployee?.name}</span>?
            Esta acción no se puede deshacer. Sus asignaciones y certificados quedarán huérfanos.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar trabajadores"
      >
        <div className="space-y-4">
          {importError ? (
            <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{importError}</p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                Se validaron <strong>{importRows.length}</strong> trabajadores. Cada cuenta usará el RUT
                como identificador y recibirá una contraseña inicial aleatoria.
              </p>
              <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">RUT</th>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Cargo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 51).map(row => (
                      <tr key={row.rut} className="border-t border-slate-700">
                        <td className="p-2">{row.rut}</td>
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancelar</Button>
            <Button onClick={confirmImport} disabled={importRows.length === 0 || isImporting}>
              {isImporting ? 'Importando...' : `Importar ${importRows.length} trabajadores`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restablecimiento masivo de credenciales temporales */}
      <Modal isOpen={showResetRutModal} onClose={() => { setShowResetRutModal(false); setResetRutResult(null); }} title="Restablecer accesos de trabajadores">
        <div className="space-y-4">
          {!resetRutResult ? (
            <>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-300 font-medium mb-2">Esta acción cambiará las credenciales de TODOS los empleados:</p>
                <ul className="text-sm text-amber-200/80 space-y-1 ml-4 list-disc">
                  <li><strong>Usuario:</strong> RUT completo como email — <code className="font-mono bg-black/20 px-1 rounded">154228225@acceso.soldesp.cl</code></li>
                  <li><strong>Contraseña temporal:</strong> RUT sin dígito verificador — debe entregarse por un canal seguro</li>
                  <li>Se activará el cambio de contraseña obligatorio en el primer login</li>
                  <li>Los usuarios sin RUT registrado serán omitidos</li>
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowResetRutModal(false)}>Cancelar</Button>
                <Button onClick={handleResetAllToRut} disabled={isResettingRut}>
                  {isResettingRut ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Procesando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" />Confirmar restablecimiento</span>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-xl border ${resetRutResult.updated > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <p className="text-sm font-semibold text-white mb-1">
                  {resetRutResult.updated} usuario{resetRutResult.updated !== 1 ? 's' : ''} actualizado{resetRutResult.updated !== 1 ? 's' : ''}
                  {resetRutResult.skipped > 0 && `, ${resetRutResult.skipped} omitido${resetRutResult.skipped !== 1 ? 's' : ''}`}
                </p>
              </div>
              {resetRutResult.results.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-slate-400">Nombre</th>
                        <th className="p-2 text-left text-slate-400">RUT</th>
                        <th className="p-2 text-left text-slate-400">Email</th>
                        <th className="p-2 text-left text-slate-400">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resetRutResult.results.map((r: any, i: number) => (
                        <tr key={i} className="border-t border-slate-700">
                          <td className="p-2 text-white">{r.name}</td>
                          <td className="p-2 font-mono text-slate-300">{r.rut}</td>
                          <td className="p-2 font-mono text-slate-300 text-xs">{r.email}</td>
                          <td className="p-2">
                            <Badge variant={r.status === 'updated' ? 'success' : 'warning'}>
                              {r.status === 'updated' ? 'OK' : r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => { setShowResetRutModal(false); setResetRutResult(null); }}>Cerrar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
};

export default EmployeeManagement;
