import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Badge, Modal, StatCard, EmptyState, Spinner } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/supabase';
import {
  FileText, FolderOpen, HardDrive, Calendar,
  Search, Upload, QrCode, Download, Link2, Trash2,
  Table2, Presentation, Image as ImageIcon, File, Filter, ArrowUpDown
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const APP_URL = 'https://capacita-pro.vercel.app';
const STORAGE_KEY = 'capacitapro_documents';

const CATEGORIES = [
  'Procedimientos', 'Políticas', 'Formatos', 'Manuales',
  'Certificados', 'Registros HSEQ', 'Otro'
] as const;

interface DocItem {
  id: string;
  name: string;
  category: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('es-CL');
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['pdf', 'docx', 'xlsx', 'pptx'].includes(ext)) return ext;
  return 'other';
}

function getTypeGradient(fileType: string): string {
  switch (fileType) {
    case 'pdf': return 'bg-gradient-to-br from-red-600/80 to-red-900/80';
    case 'docx': return 'bg-gradient-to-br from-blue-600/80 to-blue-900/80';
    case 'xlsx': return 'bg-gradient-to-br from-emerald-600/80 to-emerald-900/80';
    case 'pptx': return 'bg-gradient-to-br from-orange-600/80 to-orange-900/80';
    case 'image': return 'bg-gradient-to-br from-purple-600/80 to-purple-900/80';
    default: return 'bg-gradient-to-br from-slate-600/80 to-slate-900/80';
  }
}

function getTypeIcon(fileType: string) {
  switch (fileType) {
    case 'pdf': return FileText;
    case 'docx': return FileText;
    case 'xlsx': return Table2;
    case 'pptx': return Presentation;
    case 'image': return ImageIcon;
    default: return File;
  }
}

function getCategoryVariant(category: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  switch (category) {
    case 'Procedimientos': return 'info';
    case 'Políticas': return 'warning';
    case 'Formatos': return 'primary';
    case 'Manuales': return 'success';
    case 'Certificados': return 'danger';
    case 'Registros HSEQ': return 'default';
    default: return 'default';
  }
}

function loadDocs(): DocItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: DocItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// ── Component ──────────────────────────────────────────────────────────────────

const DocumentRepository: React.FC = () => {
  const { user } = useAuth();

  // Documents state
  const [documents, setDocuments] = useState<DocItem[]>(loadDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQrAppModal, setShowQrAppModal] = useState(false);
  const [showQrDocModal, setShowQrDocModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR refs
  const qrAppRef = useRef<HTMLDivElement>(null);
  const qrDocRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState('');

  // Persist documents
  useEffect(() => {
    saveDocs(documents);
  }, [documents]);

  // Show toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSize = documents.reduce((acc, d) => acc + d.fileSize, 0);
    const catCount: Record<string, number> = {};
    documents.forEach(d => { catCount[d.category] = (catCount[d.category] || 0) + 1; });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    const now = new Date();
    const thisMonth = documents.filter(d => {
      const dt = new Date(d.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;

    return {
      total: documents.length,
      topCategory: topCat ? topCat[0] : '—',
      totalSize,
      thisMonth,
    };
  }, [documents]);

  // ── Filtering & sorting ─────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter(d => d.category === filterCategory);
    }
    if (filterFileType) {
      if (filterFileType === 'image') {
        result = result.filter(d => d.fileType === 'image');
      } else {
        result = result.filter(d => d.fileType === filterFileType);
      }
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'size':
        result.sort((a, b) => b.fileSize - a.fileSize);
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [documents, searchTerm, filterCategory, filterFileType, sortBy]);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    setUploadName(nameWithoutExt);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName || !uploadCategory) return;
    setIsUploading(true);

    let fileUrl = '';
    const fileType = getFileType(uploadFile.name);

    // Try Supabase Storage first
    try {
      const path = `docs/${Date.now()}_${uploadFile.name}`;
      fileUrl = await storage.uploadFile('documents', path, uploadFile);
    } catch {
      // Fallback: create local object URL
      fileUrl = URL.createObjectURL(uploadFile);
    }

    const newDoc: DocItem = {
      id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: uploadName,
      category: uploadCategory,
      description: uploadDescription,
      fileUrl,
      fileType,
      fileSize: uploadFile.size,
      uploadedBy: user?.id || 'unknown',
      uploadedByName: user?.name || 'Admin',
      createdAt: new Date().toISOString(),
    };

    setDocuments(prev => [newDoc, ...prev]);
    setShowUploadModal(false);
    resetUploadForm();
    showToast('Documento subido correctamente');
    setIsUploading(false);
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadCategory('');
    setUploadDescription('');
    setIsDragOver(false);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const confirmDelete = (doc: DocItem) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    setDocuments(prev => prev.filter(d => d.id !== selectedDoc.id));
    setShowDeleteModal(false);
    setSelectedDoc(null);
    showToast('Documento eliminado');
  };

  // ── Copy link ───────────────────────────────────────────────────────────────
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Enlace copiado');
    } catch {
      showToast('No se pudo copiar');
    }
  };

  // ── Download QR helpers ─────────────────────────────────────────────────────
  const downloadDocQr = useCallback(() => {
    const svg = qrDocRef.current?.querySelector('svg');
    if (!svg || !selectedDoc) return;
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
      const qrSize = 700;
      const offset = (size - qrSize) / 2;
      ctx.drawImage(img, offset, offset - 40, qrSize, qrSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedDoc.name, size / 2, size - 60);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CapacitaPro', size / 2, size - 30);
      const link = document.createElement('a');
      link.download = `QR-${selectedDoc.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [selectedDoc]);

  const downloadAppQr = useCallback(() => {
    const svg = qrAppRef.current?.querySelector('svg');
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
      const qrSize = 650;
      const offset = (size - qrSize) / 2;
      ctx.drawImage(img, offset, offset - 60, qrSize, qrSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CapacitaPro', size / 2, size - 80);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Powered by SoldesP', size / 2, size - 45);
      const link = document.createElement('a');
      link.download = 'CapacitaPro-QR-Acceso.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  // ── Show doc QR ─────────────────────────────────────────────────────────────
  const openDocQr = (doc: DocItem) => {
    setSelectedDoc(doc);
    setShowQrDocModal(true);
  };

  return (
    <MainLayout title="Repositorio Documental" subtitle="Gestiona documentos y archivos de la organización" isAdmin>
      <div className="relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="ambient-blob ambient-blob-orange" />
        <div className="ambient-blob ambient-blob-navy" />

        <div className="relative space-y-6">
          {/* ── Stats ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 stagger-children">
            <StatCard
              label="Total documentos"
              value={stats.total}
              icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
              variant="default"
            />
            <StatCard
              label="Categoría frecuente"
              value={stats.topCategory}
              icon={<FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
              variant="primary"
            />
            <StatCard
              label="Almacenamiento"
              value={formatSize(stats.totalSize)}
              icon={<HardDrive className="w-5 h-5 sm:w-6 sm:h-6" />}
              variant="warning"
            />
            <StatCard
              label="Subidos este mes"
              value={stats.thisMonth}
              icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
              variant="success"
            />
          </div>

          {/* ── Action bar ─────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#D15F3D]/30 focus:border-[#D15F3D] outline-none min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQrAppModal(true)} className="flex items-center gap-2 min-h-[44px]">
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR de Acceso</span>
              </Button>
              <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 min-h-[44px]">
                <Upload className="w-4 h-4" />
                Subir Documento
              </Button>
            </div>
          </div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-base bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 min-h-[44px]"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <select
              value={filterFileType}
              onChange={(e) => setFilterFileType(e.target.value)}
              className="text-base bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 min-h-[44px]"
            >
              <option value="">Todos los tipos</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="xlsx">XLSX</option>
              <option value="pptx">PPTX</option>
              <option value="image">Imágenes</option>
            </select>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-base bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 min-h-[44px]"
              >
                <option value="recent">Más reciente</option>
                <option value="name">Nombre A-Z</option>
                <option value="size">Tamaño</option>
              </select>
            </div>
          </div>

          {/* ── Document grid ──────────────────────────────────────────────── */}
          {filteredDocs.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-12 h-12" />}
              title="Sin documentos"
              description={documents.length === 0 ? 'Sube tu primer documento para comenzar' : 'No hay documentos que coincidan con los filtros'}
              action={
                documents.length === 0 ? (
                  <Button onClick={() => setShowUploadModal(true)}>
                    <Upload className="w-4 h-4" /> Subir Documento
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
              {filteredDocs.map(doc => {
                const TypeIcon = getTypeIcon(doc.fileType);
                return (
                  <Card key={doc.id} className="!p-0 overflow-hidden group">
                    {/* Icon header */}
                    <div className={`h-28 flex items-center justify-center ${getTypeGradient(doc.fileType)}`}>
                      <TypeIcon className="w-12 h-12 text-white/60" />
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white line-clamp-2 text-sm leading-snug">{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getCategoryVariant(doc.category)}>{doc.category}</Badge>
                        <span className="text-xs text-slate-500 tabular-nums">{formatSize(doc.fileSize)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{formatRelativeDate(doc.createdAt)}</p>
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = doc.fileUrl;
                            a.download = doc.name;
                            a.target = '_blank';
                            // Security: Prevent reverse tabnabbing on target="_blank" links
                            a.rel = 'noopener noreferrer';
                            a.click();
                          }}
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDocQr(doc)} title="QR">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(doc.fileUrl)} title="Copiar enlace">
                          <Link2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(doc)}
                          className="text-red-400 hover:bg-red-500/10 ml-auto"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Toast ───────────────────────────────────────────────────────── */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium animate-fadeInUp backdrop-blur-md">
            {toast}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Upload Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); resetUploadForm(); }} title="Subir Documento">
        <div className="space-y-4">
          {!uploadFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-[#D15F3D] bg-[#D15F3D]/5'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-white font-medium">Arrastra un archivo aquí</p>
              <p className="text-xs text-slate-500 mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-slate-600 mt-2">PDF, DOCX, XLSX, PPTX, JPG, PNG</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                {(() => {
                  const Icon = getTypeIcon(getFileType(uploadFile.name));
                  return <Icon className="w-8 h-8 text-slate-400 shrink-0" />;
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(uploadFile.size)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setUploadFile(null); setUploadName(''); }}>
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del documento *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 focus:border-[#D15F3D] min-h-[44px]"
                  placeholder="Nombre del documento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Categoría *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 min-h-[44px]"
                >
                  <option value="">— Seleccionar categoría —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción (opcional)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 text-base bg-slate-800 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#D15F3D]/30 resize-none min-h-[44px]"
                  placeholder="Descripción breve del documento..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>Cancelar</Button>
            {uploadFile && (
              <Button
                onClick={handleUpload}
                disabled={!uploadName || !uploadCategory || isUploading}
              >
                {isUploading ? (
                  <><Spinner size="sm" /> Subiendo...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Subir</>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── QR App Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showQrAppModal} onClose={() => setShowQrAppModal(false)} title="QR de Acceso — CapacitaPro">
        <div className="space-y-4">
          <p className="text-sm text-slate-400 text-center">
            Escanea para acceder a CapacitaPro
          </p>
          <div ref={qrAppRef} className="flex justify-center p-6 bg-[#0a0d14] rounded-2xl mx-auto" style={{ width: 'fit-content' }}>
            <QRCodeSVG
              value={APP_URL}
              size={280}
              level="H"
              marginSize={2}
              bgColor="#0a0d14"
              fgColor="#ffffff"
            />
          </div>
          <p className="text-center text-xs text-slate-500 font-mono">{APP_URL}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => copyLink(APP_URL)}>
              <Link2 className="w-4 h-4" /> Copiar enlace
            </Button>
            <Button onClick={downloadAppQr}>
              <Download className="w-4 h-4" /> Descargar QR (PNG)
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── QR Document Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={showQrDocModal} onClose={() => { setShowQrDocModal(false); setSelectedDoc(null); }} title="QR del Documento">
        {selectedDoc && (
          <div className="space-y-4">
            <div ref={qrDocRef} className="flex justify-center p-6 bg-[#0a0d14] rounded-2xl mx-auto" style={{ width: 'fit-content' }}>
              <QRCodeSVG
                value={selectedDoc.fileUrl}
                size={256}
                level="H"
                marginSize={2}
                bgColor="#0a0d14"
                fgColor="#ffffff"
              />
            </div>
            <p className="text-center text-sm text-white font-medium">{selectedDoc.name}</p>
            <p className="text-center text-xs text-slate-500 font-mono break-all">{selectedDoc.fileUrl}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => { setShowQrDocModal(false); setSelectedDoc(null); }}>Cerrar</Button>
              <Button onClick={downloadDocQr}>
                <Download className="w-4 h-4" /> Descargar QR (PNG)
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedDoc(null); }} title="Eliminar Documento">
        {selectedDoc && (
          <div className="space-y-4">
            <p className="text-slate-300">
              ¿Estás seguro de que deseas eliminar <strong className="text-white">{selectedDoc.name}</strong>?
            </p>
            <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedDoc(null); }}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default DocumentRepository;
