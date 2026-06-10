import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, FileText, Bot, Database, Zap } from 'lucide-react';
import { WS_URL } from '../config';

interface ProcessingStatusProps {
  versionId: string;
}

interface StatusMessage {
  status: 'processing' | 'success' | 'failed';
  step: string;
  message: string;
}

export function ProcessingStatus({ versionId }: ProcessingStatusProps) {
  const [messages, setMessages] = useState<StatusMessage[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    // Conectar al WebSocket
    const workflowId = `process-doc-${versionId}`;
    const ws = new WebSocket(`${WS_URL}/ws/workflow/${workflowId}`);

    ws.onmessage = (event) => {
      try {
        const data: StatusMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
        setCurrentStatus(data.status);
      } catch (e) {
        console.error("Error parsing websocket message", e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [versionId]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'extraction': return <FileText className="w-5 h-5" />;
      case 'ai_analysis': return <Bot className="w-5 h-5" />;
      case 'vectorization': return <Database className="w-5 h-5" />;
      case 'complete': return <Zap className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Estado del Procesamiento AI</h3>
        {currentStatus === 'processing' && <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">Trabajando...</span>}
        {currentStatus === 'success' && <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Completado</span>}
        {currentStatus === 'failed' && <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">Error</span>}
      </div>

      <div className="space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Esperando eventos del servidor...
          </div>
        )}

        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const isProcessing = msg.status === 'processing' && isLast && currentStatus === 'processing';

          return (
            <div key={index} className={`flex items-start gap-4 p-3 rounded-lg border ${isProcessing ? 'border-brand-navy/10 bg-slate-50' : 'border-transparent'}`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${
                msg.status === 'success' ? 'bg-green-100 text-green-600' :
                msg.status === 'failed' ? 'bg-red-100 text-red-600' :
                'bg-brand-navy/10 text-brand-navy'
              }`}>
                {msg.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                 msg.status === 'failed' ? <XCircle className="w-5 h-5" /> :
                 getStepIcon(msg.step)}
              </div>
              <div className="pt-1">
                <p className={`text-sm font-medium ${
                  msg.status === 'failed' ? 'text-red-700' : 'text-brand-navy'
                }`}>
                  {msg.message}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-semibold">
                  Paso: {msg.step.replace('_', ' ')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
