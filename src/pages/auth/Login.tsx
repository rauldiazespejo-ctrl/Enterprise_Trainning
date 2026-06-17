// Página de Login - Premium Dark Theme con logo original SoldesP
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, validatePasswordComplexity } from '@/contexts/AuthContext';
import { Card, Button } from '@/components/ui/Card';
import { Eye, EyeOff, Sparkles, Award, ShieldCheck, Check, X as XIcon } from 'lucide-react';
import { SoldesPLogo } from '@/components/SoldesPLogo';
import { employeeEmailFromRut, isValidRut, normalizeRut } from '@/lib/employeeImport';

const looksLikeRut = (value: string): boolean =>
  /^\d{7,8}-?[\dkK]$/.test(value.replace(/\./g, '').replace(/\s/g, '')) ||
  /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(value.trim());

const resolveLoginEmail = (value: string): string => {
  if (looksLikeRut(value)) {
    const normalized = normalizeRut(value);
    if (isValidRut(normalized)) return employeeEmailFromRut(normalized);
  }
  return value.trim();
};

// ── Password complexity rules for live validation ────────────────────────────
const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Un número', test: (p: string) => /\d/.test(p) },
  { label: 'Un carácter especial (!@#$...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ── Change Password Screen ──────────────────────────────────────────────────

const ChangePasswordScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = validatePasswordComplexity(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = validation.valid && passwordsMatch && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsSubmitting(true);

    const result = await changePassword(newPassword);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Error al cambiar la contraseña');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center mb-4">
            <SoldesPLogo size={180} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Cambio de Contraseña</h1>
          <p className="text-sm text-[#9CA3AF]">Por seguridad, debes crear una contraseña personal</p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
          <div className="flex items-center gap-3 mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              Tu contraseña actual es temporal. Crea una contraseña segura para proteger tu cuenta.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl text-red-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

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
              {isSubmitting ? (
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
        </Card>
      </div>
    </div>
  );
};

// ── Main Login Component ────────────────────────────────────────────────────

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const isRutMode = looksLikeRut(identifier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = resolveLoginEmail(identifier);
    const result = await login(email, password);

    if (result.success) {
      if (result.mustChangePassword) {
        setShowChangePassword(true);
      } else {
        setWelcomeName('loading');
      }
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  // Step 1: resolve 'loading' → actual name
  React.useEffect(() => {
    if (welcomeName === 'loading' && user?.name) {
      setWelcomeName(user.name);
    }
  }, [welcomeName, user?.name]);

  // Step 2: once name is resolved, redirect after animation
  React.useEffect(() => {
    if (welcomeName && welcomeName !== 'loading') {
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [welcomeName, navigate]);

  if (welcomeName && welcomeName !== 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="orb-orange" style={{ top: '20%', right: '15%' }} />
        <div className="orb-navy" style={{ bottom: '20%', left: '15%' }} />

        <div className="relative z-10 text-center" style={{ animation: 'slideEnter 0.5s ease-out' }}>
          <style>{`
            @keyframes slideEnter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(209,95,61,0.3); } 50% { box-shadow: 0 0 40px rgba(209,95,61,0.6); } }
          `}</style>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#D15F3D]/20 border-2 border-[#D15F3D]/50 mb-6"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
            <Sparkles className="w-10 h-10 text-[#D15F3D]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            ¡Bienvenido/a!
          </h1>
          <p className="text-2xl text-[#D15F3D] font-semibold mb-2">
            {welcomeName}
          </p>
          <p className="text-slate-400 text-sm mt-4">Ingresando a la plataforma...</p>
          <div className="mt-6 w-48 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#D15F3D] to-[#E87A58] rounded-full"
              style={{ animation: 'fillBar 2.5s ease-out forwards' }} />
          </div>
          <style>{`@keyframes fillBar { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      </div>
    );
  }

  if (showChangePassword) {
    return <ChangePasswordScreen onSuccess={() => {
      setShowChangePassword(false);
      setWelcomeName('loading');
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
      <div className="absolute top-0 left-0 w-full h-full bg-dots-pattern" />

      <div className="orb-orange" style={{ top: '10%', left: '5%' }} />
      <div className="orb-navy" style={{ bottom: '15%', right: '10%' }} />
      <div className="orb-orange" style={{ bottom: '40%', left: '30%', width: '200px', height: '200px' }} />

      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center justify-center mb-6 animate-float">
            <SoldesPLogo size={260} />
          </div>

          <h1 className="text-5xl font-bold gradient-text mb-3 tracking-tight">CapacitaPro</h1>
          <p className="text-lg text-[#9CA3AF] flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-[#D15F3D] rounded-full animate-pulse" />
            Powered by SoldesP
          </p>
          <p className="text-sm text-[#64748B] mt-2">Plataforma de Capacitación Corporativa</p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(209,95,61,0.1)] rounded-full border border-[rgba(209,95,61,0.3)] mb-4">
              <Award className="w-4 h-4 text-[#D15F3D]" />
              <span className="text-sm text-[#D15F3D] font-medium">Acceso Seguro</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
            <p className="text-sm text-[#9CA3AF]">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl text-red-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#D1D5DB] flex items-center gap-2">
                <div className="w-1 h-4 bg-[#D15F3D] rounded-full" />
                RUT
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="15422822-5 o 154228225"
                required
                autoComplete="username"
                className="input-modern font-mono focus:border-[#D15F3D] focus:shadow-[0_0_0_3px_rgba(209,95,61,0.15)]"
              />
              {isRutMode && (
                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  RUT reconocido
                </p>
              )}
            </div>

            <div className="space-y-1 relative">
              <label className="block text-sm font-medium text-[#D1D5DB] flex items-center gap-2">
                <div className="w-1 h-4 bg-[#D15F3D] rounded-full" />
                Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRutMode ? 'RUT sin dígito verificador (ej. 15422822)' : 'Tu contraseña'}
                required
                className="input-modern pr-12 font-mono focus:border-[#D15F3D] focus:shadow-[0_0_0_3px_rgba(209,95,61,0.15)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-[#9CA3AF] hover:text-[#D15F3D] transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </span>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-[#9CA3AF] hover:text-[#D15F3D] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-5 p-4 bg-[rgba(0,27,75,0.2)] rounded-xl border border-[rgba(0,27,75,0.4)]">
              <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
                <span className="text-[#D15F3D] font-semibold">Usuario:</span> RUT con dígito verificador — <span className="font-mono">15422822-5</span><br />
                <span className="text-[#D15F3D] font-semibold">Contraseña:</span> RUT sin dígito verificador — <span className="font-mono">15422822</span>
              </p>
            </div>
          )}
        </Card>

        <div className="text-center mt-8 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <p className="text-[#64748B] text-sm flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-[#001B4B] rounded-full border border-[#D15F3D]" />
            © 2026 SoldesP - CapacitaPro. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
