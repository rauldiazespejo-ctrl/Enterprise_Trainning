import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, ShieldAlert, Loader2, FileText } from 'lucide-react';
import { API_URL } from '../config';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  sources?: string[];
}

interface Procedure {
  id: string;
  title: string;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '¡Hola! Soy tu Asistente de Seguridad. Selecciona un procedimiento y hazme preguntas sobre riesgos, pasos a seguir o EPP requerido.',
    }
  ]);
  const [input, setInput] = useState('');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar procedimientos para el selector
    axios.get(`${API_URL}/api/v1/procedures/`)
      .then(res => {
        setProcedures(res.data);
        if (res.data.length > 0) setSelectedProcedure(res.data[0].id);
      })
      .catch(console.error);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedProcedure || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/chat/ask`, {
        message: userMessage.content,
        procedure_id: selectedProcedure
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.data.reply,
        sources: response.data.sources
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Lo siento, hubo un error al conectar con la IA o no se encontró el procedimiento en la base vectorial.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-100px)]">
        {/* Header con Selector */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-brand-navy/10 p-2 rounded-lg text-brand-navy">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-navy">Asistente IA de Seguridad</h2>
              <p className="text-sm text-slate-500">Consulta los manuales cargados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-orange focus:border-brand-orange block w-full p-2.5 max-w-xs"
            >
              {procedures.length === 0 && <option value="">Cargando procedimientos...</option>}
              {procedures.map(proc => (
                <option key={proc.id} value={proc.id}>{proc.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Historial de Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                msg.type === 'user'
                  ? 'bg-brand-navy text-white rounded-tr-sm'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-brand-orange font-medium">
                    <FileText className="w-3 h-3" /> Extraído del documento (Párrafos: {msg.sources.length})
                  </div>
                )}
              </div>

              {msg.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando el procedimiento...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200 rounded-b-xl">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedProcedure ? "Ej: ¿Qué EPP necesito para trabajar en altura?" : "Selecciona un procedimiento primero..."}
              disabled={!selectedProcedure || isLoading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || !selectedProcedure || isLoading}
              className="px-5 py-3 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
