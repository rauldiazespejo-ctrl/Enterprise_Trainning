import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileType, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

interface DocumentUploadProps {
  onUploadSuccess: (procedureId: string, versionId: string) => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('internal');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validTypes = ['.pdf', '.doc', '.docx'];
      const isValid = validTypes.some(type => selectedFile.name.toLowerCase().endsWith(type));

      if (!isValid) {
        setError('Por favor, selecciona un archivo PDF o Word válido.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    // Nota: El Backend espera que el companyId provenga de la DB (Postgres).
    // Dejamos un valor que no va a cumplir con la llave foránea porque las migraciones y seed no están implementados,
    // o simplemente omitimos el parámetro si lo quitamos del backend. Por ahora usar un UUID default o uno válido si existe DB local.
    const companyId = '00000000-0000-0000-0000-000000000000'; // Placeholder - REQUIERE LOGIN/SEED

    try {
      const response = await axios.post(`${API_URL}/api/v1/documents/upload?company_id=${companyId}&title=${encodeURIComponent(title)}&doc_type=${docType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.procedure_version_id) {
        onUploadSuccess(response.data.procedure_id, response.data.procedure_version_id);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Hubo un error al subir el documento.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Subir Nuevo Procedimiento</h2>

      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del Documento
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ej: Procedimiento de Trabajo Seguro en Alturas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all"
          >
            <option value="internal">Interno (Empresa)</option>
            <option value="client">Cliente</option>
          </select>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${file ? 'border-brand-navy bg-slate-50' : 'border-gray-300 hover:border-brand-orange bg-white hover:bg-orange-50/30'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center">
              <FileType className="w-10 h-10 text-brand-orange mb-3" />
              <p className="text-sm font-medium text-brand-navy">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-brand-navy mb-1">Haz clic para seleccionar un archivo</p>
              <p className="text-xs text-slate-500">PDF, DOC, DOCX (Max 20MB)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || !title || isUploading}
          className={`w-full py-3 px-4 flex justify-center items-center gap-2 rounded-lg text-white font-medium transition-all
            ${!file || !title || isUploading
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : 'bg-brand-orange hover:bg-brand-orange-light shadow-md hover:shadow-lg'}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando y Subiendo...
            </>
          ) : (
            <>
              Subir Documento
              <UploadCloud className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
