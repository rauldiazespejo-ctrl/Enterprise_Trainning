import { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { FileText, Loader2, RefreshCcw } from 'lucide-react';
import { API_URL } from '../config';

interface Procedure {
  id: string;
  title: string;
  type: string;
  latest_version: string | null;
  status: string | null;
  created_at: string;
}

export function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/procedures/`);
      setProcedures(response.data);
    } catch (err) {
      console.error('Error fetching procedures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'published':
        return <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Completado</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">Procesando IA</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">Error</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">{status || 'Borrador'}</span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Mis Procedimientos</h1>
          <p className="text-slate-500 mt-1">Listado de todos los documentos operativos subidos.</p>
        </div>
        <button
          onClick={fetchProcedures}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      ) : procedures.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-navy">No hay procedimientos</h3>
          <p className="text-slate-500 mt-1">Sube tu primer documento desde la pestaña "Subir Documento".</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión Activa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Creación</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {procedures.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-brand-orange rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-medium text-brand-navy truncate max-w-xs" title={proc.title}>
                        {proc.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600 capitalize">{proc.type === 'internal' ? 'Interno' : proc.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700">{proc.latest_version || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(proc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(proc.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
