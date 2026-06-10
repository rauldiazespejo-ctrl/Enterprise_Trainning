import { useState } from 'react';
import { DocumentUpload } from './components/DocumentUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import logo from './assets/logo.png';

function App() {
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  const handleUploadSuccess = (procedureId: string, versionId: string) => {
    console.log('Upload success:', { procedureId, versionId });
    setActiveVersionId(versionId);
  };

  const handleReset = () => {
    setActiveVersionId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Soldesp Logo" className="h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy tracking-tight">
            Gestor de Procedimientos de Trabajo
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Sube tus documentos operativos para que nuestra Inteligencia Artificial analice y extraiga automáticamente los pasos, riesgos y controles críticos.
          </p>
        </div>

        {!activeVersionId ? (
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-center">
              <h3 className="font-medium text-lg">¡Documento subido correctamente!</h3>
              <p className="text-sm mt-1 opacity-80">
                La Inteligencia Artificial está analizando el documento.
              </p>
            </div>

            <ProcessingStatus versionId={activeVersionId} />

            <div className="text-center mt-8">
              <button
                onClick={handleReset}
                className="text-brand-orange font-medium hover:text-brand-orange-light transition-colors text-sm"
              >
                ← Subir otro documento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
