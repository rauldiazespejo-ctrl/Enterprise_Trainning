// Gestión de Cursos - Página del Administrador
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge, Input, Select, Modal } from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { useCourses } from '@/contexts/CourseContext';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Eye
} from 'lucide-react';

const CourseManagement: React.FC = () => {
  const { courses, deleteCourse } = useCourses();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // BOLT OPTIMIZATION: Memoize filtered array to prevent expensive recalculations on every render
  const filteredCourses = useMemo(() => courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [courses, searchTerm, statusFilter]);

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const paginatedCourses = useMemo(() => filteredCourses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  ), [filteredCourses, currentPage]);

  const handleDelete = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (courseToDelete) {
      await deleteCourse(courseToDelete);
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Publicado</Badge>;
      case 'draft':
        return <Badge variant="warning">Borrador</Badge>;
      case 'archived':
        return <Badge variant="default">Archivado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  return (
    <MainLayout title="Gestión de Cursos" subtitle="Administra todos los cursos de la plataforma" isAdmin>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10 pr-4 py-2 w-64 text-base"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'published', label: 'Publicados' },
                { value: 'draft', label: 'Borradores' },
                { value: 'archived', label: 'Archivados' }
              ]}
            />
          </div>
          <Link to="/admin/documents">
            <Button>
              <Plus className="w-4 h-4" />
              Nuevo Curso
            </Button>
          </Link>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {paginatedCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden !p-0">
              {/* Course Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-[#D15F3D] to-[#001B4B] flex items-center justify-center overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-16 h-16 text-white/50" />
                )}
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-white line-clamp-2 text-base leading-snug">{course.title}</h3>
                  {getStatusBadge(course.status)}
                </div>
                {course.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.modules?.length || 0} módulos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    12 empleados
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.estimatedDuration} min
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                  <Link to={`/admin/courses/${course.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {filteredCourses.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-slate-700/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={PAGE_SIZE}
              totalItems={filteredCourses.length}
            />
          </div>
        )}

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No se encontraron cursos</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer curso'}
            </p>
            <Link to="/admin/documents">
              <Button>
                <Plus className="w-4 h-4" />
                Crear Curso
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-slate-400">
            ¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default CourseManagement;