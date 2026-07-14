// Componente de Certificado Premium - Logo Original SoldesP
import React, { useRef } from 'react';
import { Award, Download, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { SoldesPCertificateLogo } from '@/components/SoldesPLogo';

interface CertificateViewProps {
  userName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  score?: number;
  onClose?: () => void;
}

const CertificateView: React.FC<CertificateViewProps> = ({
  userName,
  courseName,
  completionDate,
  certificateId,
  score,
  onClose
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (certificateRef.current) {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const link = document.createElement('a');
      link.download = `certificado-${certificateId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="relative w-full max-w-4xl aspect-[1.414] bg-white shadow-2xl"
        style={{ aspectRatio: '1.414' }}
      >
        {/* Certificate Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          {/* Decorative Border */}
          <div className="absolute inset-4 border-4 border-[#001B4B]/10 rounded-3xl" />
          <div className="absolute inset-6 border-2 border-[#D15F3D]/20 rounded-2xl" />

          {/* Corner Decorations */}
          <div className="absolute top-8 left-8 w-24 h-24 border-t-4 border-l-4 border-[#001B4B]/20 rounded-tl-3xl" />
          <div className="absolute top-8 right-8 w-24 h-24 border-t-4 border-r-4 border-[#001B4B]/20 rounded-tr-3xl" />
          <div className="absolute bottom-8 left-8 w-24 h-24 border-b-4 border-l-4 border-[#001B4B]/20 rounded-bl-3xl" />
          <div className="absolute bottom-8 right-8 w-24 h-24 border-b-4 border-r-4 border-[#001B4B]/20 rounded-br-3xl" />

          {/* Main Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
            {/* Header Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 bg-[#001B4B] rounded-full">
                <span className="text-white text-xs font-bold tracking-widest">CERTIFICADO DE FINALIZACIÓN</span>
              </div>
            </div>

            {/* Logo Original SoldesP */}
            <div className="mb-6">
              <SoldesPCertificateLogo size={180} />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-[#001B4B] mb-2 tracking-tight">
                CERTIFICADO
              </h1>
              <p className="text-xl text-[#D15F3D] font-semibold tracking-widest uppercase">
                Certificate of Completion
              </p>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent to-[#D15F3D]" />
              <div className="w-3 h-3 bg-[#D15F3D] rounded-full" />
              <div className="w-24 h-0.5 bg-gradient-to-l from-transparent to-[#D15F3D]" />
            </div>

            {/* Recipient */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500 font-medium tracking-widest uppercase mb-2">
                Otorgado a
              </p>
              <h2 className="text-4xl font-bold text-[#001B4B] mb-2">
                {userName}
              </h2>
              <div className="w-48 h-0.5 bg-[#D15F3D] mx-auto mb-4" />
            </div>

            {/* Achievement */}
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 font-medium tracking-widest uppercase mb-2">
                Por completar exitosamente
              </p>
              <h3 className="text-2xl font-bold text-[#1E3A6E] mb-2">
                {courseName}
              </h3>
              {score && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Puntuación: {score}%</span>
                </div>
              )}
            </div>

            {/* Date and ID */}
            <div className="flex items-center justify-center gap-12 mb-8">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">Fecha de Emisión</p>
                <p className="text-lg font-bold text-[#001B4B]">{completionDate}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">Código de Verificación</p>
                <p className="text-lg font-mono text-[#D15F3D] font-bold">{certificateId}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between w-full mt-auto pt-8 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D15F3D]" />
                <span className="text-sm font-semibold text-slate-600">CapacitaPro</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D15F3D]" />
                <span className="text-xs text-slate-500">Powered by SoldesP</span>
              </div>
              <div className="text-xs text-slate-400">
                Capacitación Corporativa
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-[#D15F3D] text-white font-semibold rounded-xl hover:bg-[#B34E2D] transition-all shadow-lg shadow-[rgba(209,95,61,0.3)]"
        >
          <Download className="w-5 h-5" />
          Descargar Certificado
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};

export default CertificateView;
