import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button } from '@/components/ui/Card';
import { Download, Copy, Check } from 'lucide-react';

const APP_URL = 'https://capacita-pro.vercel.app';

interface AppAccessQRProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppAccessQR: React.FC<AppAccessQRProps> = ({ isOpen, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const downloadQr = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size + 160; // extra space for text
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Dark background
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw QR
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const qrSize = 800;
      const qrX = (size - qrSize) / 2;
      ctx.drawImage(img, qrX, 60, qrSize, qrSize);
      // Title text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Lexend, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CapacitaPro', size / 2, qrSize + 120);
      // Subtitle
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '28px Source Sans 3, system-ui, sans-serif';
      ctx.fillText('Powered by SoldesP', size / 2, qrSize + 160);
      // Download
      const link = document.createElement('a');
      link.download = 'CapacitaPro-QR-Acceso.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR de Acceso">
      <div className="flex flex-col items-center gap-5">
        <p className="text-sm text-slate-400 text-center">Escanea para acceder a CapacitaPro</p>
        <div ref={qrRef} className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.08]">
          <QRCodeSVG
            value={APP_URL}
            size={260}
            bgColor="#0a0e1a"
            fgColor="#ffffff"
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-xs text-slate-500 font-mono select-all">{APP_URL}</p>
        <div className="flex gap-3 w-full">
          <Button onClick={downloadQr} className="flex-1 min-h-[44px]">
            <Download className="w-4 h-4" />
            Descargar QR
          </Button>
          <Button variant="outline" onClick={copyLink} className="flex-1 min-h-[44px]">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AppAccessQR;
