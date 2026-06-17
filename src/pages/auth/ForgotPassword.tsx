// Página de recuperación de contraseña
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui/Card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { SoldesPLogo } from '@/components/SoldesPLogo';
import { supabase } from '@/lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        setError('La recuperación de contraseña solo está disponible en producción.');
        setIsLoading(false);
        return;
      }

      // Enviar email de recuperación usando Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Error al enviar el correo de recuperación');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intenta nuevamente.');
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 animate-float">
              <SoldesPLogo size={180} />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3 tracking-tight">Correo Enviado</h1>
          </div>

          <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Revisa tu correo electrónico</h2>
              <p className="text-sm text-[#9CA3AF] mb-6 leading-relaxed">
                Hemos enviado un enlace de recuperación a <span className="text-[#D15F3D] font-medium">{email}</span>.
                <br />
                Haz clic en el enlace para restablecer tu contraseña.
              </p>

              <div className="w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                <p className="text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>El enlace expira en 1 hora. Revisa también tu carpeta de spam.</span>
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 animate-float">
            <SoldesPLogo size={180} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Recuperar Contraseña</h1>
          <p className="text-sm text-[#9CA3AF]">Ingresa tu correo para recibir un enlace de recuperación</p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
          {error && (
            <div className="mb-4 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#D1D5DB] flex items-center gap-2">
                <div className="w-1 h-4 bg-[#D15F3D] rounded-full" />
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-[14px] w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  autoComplete="email"
                  className="input-modern pl-12 focus:border-[#D15F3D] focus:shadow-[0_0_0_3px_rgba(209,95,61,0.15)]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-base py-4 shadow-[0_4px_20px_rgba(209,95,61,0.4)]"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Enviar Enlace de Recuperación
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)] text-center">
            <Link
              to="/login"
              className="text-sm text-[#9CA3AF] hover:text-[#D15F3D] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
