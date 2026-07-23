// Gestión de Certificados - Página del Administrador
import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import CertificateView from '@/pages/employee/CertificateView';
import {
  Search,
  Award,
  Download,
  Eye,
  CheckCircle,
  DownloadCloud
} from 'lucide-react';

interface CertificateRow {
  id: string;
  employeeName: string;
  employeeEmail: string;
  courseName: string;
  score: number;
  issuedAt: Date;
  verificationCode: string;
}

const CertificateManagement: React.FC = () => {
  const { certificates, courses } = useCourses();
  const { users } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateRow | null>(null);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);

  // Unir certificados con empleados y cursos
  const rows: CertificateRow[] = useMemo(() => certificates.map(cert => {
    const employee = userMap.get(cert.userId);
    const course = courseMap.get(cert.courseId);
    return {
      id: cert.id,
      employeeName: employee?.name || 'Usuario eliminado',
      employeeEmail: employee?.email || '—',
      courseName: course?.title || 'Curso eliminado',
      score: cert.score,
      issuedAt: new Date(cert.issuedAt),
      verificationCode: cert.verificationCode
    };
  }), [certificates, userMap, courseMap]);

  const filteredRows = useMemo(() => rows.filter(cert =>
    cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.verificationCode.toLowerCase().includes(searchTerm.toLowerCase())
  ), [rows, searchTerm]);

  const averageScore = rows.length > 0
    ? Math.round(rows.reduce((sum, c) => sum + c.score, 0) / rows.length)
    : 0;

  const exportCSV = () => {
    const header = 'Empleado,Email,Curso,Puntuación,Fecha de Emisión,Código de Verificación';
    const lines = filteredRows.map(c =>
      [c.employeeName, c.employeeEmail, c.courseName, `${c.score}%`, c.issuedAt.toLocaleDateString('es-ES'), c.verificationCode]
        .map(field => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob(['﻿' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `certificados-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <MainLayout title="Certificados" subtitle="Gestiona y verifica los certificados emitidos" isAdmin>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
                <p className="text-sm text-slate-500">Total Certificados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
                <p className="text-sm text-slate-500">Válidos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/10 rounded-lg text-brand">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{averageScore}%</p>
                <p className="text-sm text-slate-500">Promedio de Puntuación</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, curso o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
            />
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={filteredRows.length === 0}>
            <DownloadCloud className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Certificates Table */}
        <Card className="overflow-hidden">
          {filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {rows.length === 0 ? 'Aún no se han emitido certificados' : 'Sin resultados para la búsqueda'}
              </h3>
              <p className="text-slate-500">
                {rows.length === 0
                  ? 'Los certificados aparecerán aquí cuando los empleados completen cursos y aprueben la evaluación final.'
                  : 'Intenta con otro término de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Empleado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Curso</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Puntuación</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Código</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((cert) => (
                    <tr key={cert.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-brand to-[#001B4B] rounded-full flex items-center justify-center text-white font-semibold">
                            {cert.employeeName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{cert.employeeName}</p>
                            <p className="text-sm text-slate-500">{cert.employeeEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{cert.courseName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          {cert.score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {cert.issuedAt.toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                          {cert.verificationCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success">Válido</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedCertificate(cert)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedCertificate(cert)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Vista del certificado (con descarga) */}
      {selectedCertificate && (
        <CertificateView
          userName={selectedCertificate.employeeName}
          courseName={selectedCertificate.courseName}
          completionDate={selectedCertificate.issuedAt.toLocaleDateString('es-ES')}
          certificateId={selectedCertificate.verificationCode}
          score={selectedCertificate.score}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </MainLayout>
  );
};

export default CertificateManagement;
