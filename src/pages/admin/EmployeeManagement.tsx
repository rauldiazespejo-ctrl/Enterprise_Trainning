// Gestión de Empleados - Página del Administrador
import React, { useRef, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge, Modal } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { downloadCredentialsCsv, EmployeeImportRow, parseEmployeeWorkbook } from '@/lib/employeeImport';
import {
  Plus,
  Search,
  Users,
  Award,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle,
  Upload
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

const EmployeeManagement: React.FC = () => {
  const { courses, assignments, certificates, assignCourse, getUserAssignments } = useCourses();
  const { user, users, addUser, updateUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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
  const importInputRef = useRef<HTMLInputElement>(null);

  const employees = users.filter(u => u.role === 'employee');

  const employeeStats = (employeeId: string) => {
    const userAssignments = getUserAssignments(employeeId);
    return {
      completed: userAssignments.filter(a => a.status === 'completed').length,
      inProgress: userAssignments.filter(a => a.status === 'in_progress').length,
      certificates: certificates.filter(c => c.userId === employeeId).length
    };
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Nombre y correo son obligatorios');
      return;
    }

    if (editingId) {
      const updates: Partial<User> = {
        name: form.name.trim(),
        rut: form.rut.trim() || undefined,
        email: form.email.trim(),
        department: form.department.trim() || undefined,
        position: form.position.trim() || undefined,
        status: form.status
      };
      if (form.password.trim()) {
        updates.password = form.password.trim();
      }
      await updateUser(editingId, updates);
    } else {
      if (!form.password.trim()) {
        setFormError('Define una contraseña inicial para el empleado');
        return;
      }
      const result = await addUser({
        name: form.name.trim(),
        rut: form.rut.trim() || undefined,
        email: form.email.trim(),
        role: 'employee',
        department: form.department.trim() || undefined,
        position: form.position.trim() || undefined,
        password: form.password.trim(),
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
          const password = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
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

  const totalCompleted = employees.reduce((sum, e) => sum + employeeStats(e.id).completed, 0);
  const totalInTraining = employees.filter(e => employeeStats(e.id).inProgress > 0).length;

  return (
    <MainLayout title="Gestión de Empleados" subtitle="Administra usuarios y asigna cursos" isAdmin>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
                <p className="text-sm text-slate-500">Total Empleados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalInTraining}</p>
                <p className="text-sm text-slate-500">En Capacitación</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D15F3D]/10 rounded-lg text-[#D15F3D]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCompleted}</p>
                <p className="text-sm text-slate-500">Cursos Completados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{certificates.length}</p>
                <p className="text-sm text-slate-500">Certificados</p>
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 focus:border-[#D15F3D] outline-none"
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
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
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Empleado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Cursos</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Certificados</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const stats = employeeStats(employee.id);
                    return (
                      <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D15F3D] to-[#001B4B] rounded-full flex items-center justify-center text-white font-semibold">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{employee.name}</p>
                              <p className="text-sm text-slate-500">{employee.email}</p>
                              {employee.rut && <p className="text-xs text-slate-400">RUT: {employee.rut}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{employee.department || '—'}</p>
                            <p className="text-sm text-slate-500">{employee.position || ''}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {stats.completed} completados
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
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
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-900">{selectedEmployee.name}</p>
              <p className="text-sm text-slate-500">{selectedEmployee.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Curso</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 focus:border-[#D15F3D] outline-none"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
              placeholder="Ej. María García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
            <input
              type="text"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
              placeholder="Ej. 12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
              placeholder="correo@empresa.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
                placeholder="Ventas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Puesto</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
                placeholder="Ejecutivo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {editingId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
                placeholder={editingId ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D15F3D]/30 outline-none"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{formError}</p>
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
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{importError}</p>
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
    </MainLayout>
  );
};

export default EmployeeManagement;
