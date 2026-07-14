// Certificados del Empleado
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import CertificateView from '@/pages/employee/CertificateView';
import { Certificate } from '@/types';
import { Award, Download, Eye, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmployeeCertificates: React.FC = () => {
  const { user } = useAuth();
  const { getUserCertificates, verifyCertificate, courses } = useCourses();

  const [certificateToShow, setCertificateToShow] = useState<Certificate | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ found: boolean; certificate?: Certificate } | null>(null);

  const certificates = user ? getUserCertificates(user.id) : [];

  const courseTitle = (courseId: string): string =>
    courses.find(c => c.id === courseId)?.title || 'Curso';

  const handleVerify = () => {
    if (!verifyCode.trim()) return;
    const certificate = verifyCertificate(verifyCode);
    setVerifyResult({ found: !!certificate, certificate });
  };

  const averageScore = certificates.length > 0
    ? Math.round(certificates.reduce((sum, c) => sum + c.score, 0) / certificates.length)
    : 0;

  return (
    <MainLayout title="Mis Certificados" subtitle="Historial de certificados obtenidos" isAdmin={false}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{certificates.length}</p>
                <p className="text-sm text-slate-500">Certificados Obtenidos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{averageScore}%</p>
                <p className="text-sm text-slate-500">Promedio de Puntuación</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {new Date().getFullYear()}
                </p>
                <p className="text-sm text-slate-500">Año Actual</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden">
                {/* Certificate Preview */}
                <div className="p-6 bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-b border-slate-200">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Certificado de Finalización</h3>
                    <p className="text-sm text-slate-500 mt-1">{user?.name}</p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Curso Completado</p>
                      <p className="font-medium text-slate-900">{courseTitle(cert.courseId)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Puntuación</p>
                        <p className="font-semibold text-green-600">{cert.score}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Fecha de Emisión</p>
                        <p className="font-medium text-slate-900">
                          {new Date(cert.issuedAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">
                        Código de Verificación: <code className="bg-slate-100 px-2 py-1 rounded">{cert.verificationCode}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setCertificateToShow(cert)}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setCertificateToShow(cert)}
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tienes certificados aún</h3>
            <p className="text-slate-500 mb-4">
              Completa cursos y aprueba la evaluación final para obtener tus certificados
            </p>
            <Link to="/employee">
              <Button>Ver Mis Cursos</Button>
            </Link>
          </Card>
        )}

        {/* Verification Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Verificar Certificado</h3>
          <p className="text-sm text-slate-500 mb-4">
            Si necesitas verificar la autenticidad de un certificado, puedes ingresar el código de verificación.
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Ingresa el código de verificación"
              value={verifyCode}
              onChange={(e) => {
                setVerifyCode(e.target.value);
                setVerifyResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Button variant="outline" onClick={handleVerify} disabled={!verifyCode.trim()}>
              Verificar
            </Button>
          </div>

          {verifyResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${verifyResult.found ? 'bg-green-50' : 'bg-red-50'}`}>
              {verifyResult.found && verifyResult.certificate ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <p className="font-semibold">Certificado válido</p>
                    <p>
                      Curso: {courseTitle(verifyResult.certificate.courseId)} ·
                      Puntuación: {verifyResult.certificate.score}% ·
                      Emitido: {new Date(verifyResult.certificate.issuedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-semibold">Código no encontrado</p>
                    <p>No existe ningún certificado con ese código de verificación.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Visor del certificado (con descarga) */}
      {certificateToShow && user && (
        <CertificateView
          userName={user.name}
          courseName={courseTitle(certificateToShow.courseId)}
          completionDate={new Date(certificateToShow.issuedAt).toLocaleDateString('es-ES')}
          certificateId={certificateToShow.verificationCode}
          score={certificateToShow.score}
          onClose={() => setCertificateToShow(null)}
        />
      )}
    </MainLayout>
  );
};

export default EmployeeCertificates;
