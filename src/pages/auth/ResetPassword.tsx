// Página de restablecimiento de contraseña con token
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui/Card';
import { Eye, EyeOff, ShieldCheck, Check, X as XIcon, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { SoldesPLogo } from '@/components/SoldesPLogo';
import { supabase } from '@/lib/supabase';
import { validatePasswordComplexity } from '@/contexts/AuthContext';

// ── Password complexity rules for live validation ────────────────────────────
const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Un número', test: (p: string) => /\d/.test(p) },
  { label: 'Un carácter especial (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Verificar si el token es válido al cargar el componente
  useEffect(() => {
    const validateToken = async () => {
      // El token viene en el hash de la URL cuando Supabase redirige
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (!isSupabaseConfigured) {
        setError('La recuperación de contraseña solo está disponible en producción.');
        setIsValidating(false);
        return;
      }

      if (accessToken) {
        // Configurar la sesión con el token recibido
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) {
          setError('El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.');
        }
      } else {
        // Verificar si hay una sesión activa
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError('El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.');
        }
      }

      setIsValidating(false);
    };

    void validateToken();
  }, [isSupabaseConfigured]);

  const validation = validatePasswordComplexity(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = validation.valid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        setError('La recuperación de contraseña solo está disponible en producción.');
        setIsLoading(false);
        return;
      }

      // Actualizar la contraseña usando supabase.auth.updateUser
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Error al actualizar la contraseña');
        setIsLoading(false);
        return;
      }

      // Limpiar el hash de la URL
      window.history.replaceState({}, document.title, window.location.pathname);

      setIsSuccess(true);
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intenta nuevamente.');
    }

    setIsLoading(false);
  };

  // Estado de validación del token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <SoldesPLogo size={180} />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Validando Enlace</h1>
          </div>

          <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#D15F3D]/20 border-2 border-[#D15F3D]/50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#D15F3D] animate-pulse" />
              </div>
              <p className="text-[#9CA3AF]">Verificando el enlace de recuperación...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Estado de éxito
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 animate-float">
              <SoldesPLogo size={180} />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Contraseña Actualizada</h1>
          </div>

          <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">¡Contraseña Restablecida!</h2>
              <p className="text-sm text-[#9CA3AF] mb-6 leading-relaxed">
                Tu contraseña ha sido actualizada exitosamente.
                <br />
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>

              <Button
                onClick={() => navigate('/login')}
                className="w-full text-base py-4 shadow-[0_4px_20px_rgba(209,95,61,0.4)]"
                size="lg"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Ir al Login
                </span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Estado de error en token
  const isTokenError = error.includes('expirado') || error.includes('inválido');

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 animate-float">
            <SoldesPLogo size={180} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Nueva Contraseña</h1>
          <p className="text-sm text-[#9CA3AF]">Crea una contraseña segura para tu cuenta</p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
          {error && (
            <div className="mb-4 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {isTokenError && (
                  <Link
                    to="/forgot-password"
                    className="text-[#D15F3D] hover:underline mt-2 inline-block"
                  >
                    Solicitar nuevo enlace
                  </Link>
                )}
              </div>
            </div>
          )}

          {!isTokenError && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-[#D1D5DB] flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#D15F3D] rounded-full" />
                  Nueva Contraseña
                </label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  autoComplete="new-password"
                  className="input-modern pr-12 font-mono focus:border-[#D15F3D] focus:shadow-[0_0_0_3px_rgba(209,95,61,0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-[38px] text-[#9CA3AF] hover:text-[#D15F3D] transition-colors p-1"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Complexity checklist */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  {PASSWORD_RULES.map((rule) => {
                    const passes = rule.test(newPassword);
                    return (
                      <div key={rule.label} className="flex items-center gap-2 text-xs">
                        {passes ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className={passes ? 'text-emerald-400' : 'text-slate-500'}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirm password */}
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-[#D1D5DB] flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#D15F3D] rounded-full" />
                  Confirmar Contraseña
                </label>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  autoComplete="new-password"
                  className="input-modern pr-12 font-mono focus:border-[#D15F3D] focus:shadow-[0_0_0_3px_rgba(209,95,61,0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-[38px] text-[#9CA3AF] hover:text-[#D15F3D] transition-colors p-1"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <XIcon className="w-3 h-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <Check className="w-3 h-3" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-base py-4 shadow-[0_4px_20px_rgba(209,95,61,0.4)]"
                size="lg"
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Guardar Nueva Contraseña
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)] text-center">
            <Link
              to="/login"
              className="text-sm text-[#9CA3AF] hover:text-[#D15F3D] transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Volver al Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
