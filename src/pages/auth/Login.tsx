// Página de Login — Split-screen premium con tema claro/oscuro
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { validatePasswordComplexity } from '@/lib/auth';
import { Card, Button } from '@/components/ui/Card';
import { Eye, EyeOff, Sparkles, Award, ShieldCheck, Check, X as XIcon, Sun, Moon, Mail, UserRound } from 'lucide-react';
import { SoldesPLogo } from '@/components/SoldesPLogo';
import { employeeEmailFromRut, isValidRut, normalizeRut } from '@/lib/employeeImport';

const INDUSTRIAL_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80';

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

// ── Confetti pieces for welcome celebration ─────────────────────────────────
const CONFETTI_COLORS = [
  'hsl(var(--brand))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--primary))',
  'hsl(var(--brand) / 0.7)',
  'hsl(var(--secondary) / 0.7)',
];

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Confetti: React.FC = () => {
  const pieces = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${1.8 + Math.random() * 1.4}s`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }));
  }, []);

  if (prefersReducedMotion()) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-20">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece animate-confetti"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

// ── Change Password Screen ──────────────────────────────────────────────────

const ChangePasswordScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex relative overflow-hidden overflow-x-hidden bg-background">
      {/* Left: industrial image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={INDUSTRIAL_IMAGE}
          alt="Seguridad industrial"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="login-hero-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="mb-8">
            <SoldesPLogo size={160} />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Seguridad y<br />capacitación <span className="text-brand">sin límites</span>
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            Plataforma corporativa de gestión HSEQ para el desarrollo continuo de tu equipo.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/10" />
        <div className="absolute inset-0 bg-dots-pattern opacity-30" />
        <div className="orb-orange" style={{ top: '10%', right: '5%' }} />
        <div className="orb-navy" style={{ bottom: '15%', left: '10%' }} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand/40 transition-all z-10 focus-ring tap-target-min"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-flex items-center justify-center mb-4 lg:hidden">
              <SoldesPLogo size={140} />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Cambio de Contraseña</h1>
            <p className="text-sm text-muted-foreground">Por seguridad, debes crear una contraseña personal</p>
          </div>

          <Card className="login-glass p-6 sm:p-8 animate-slideUp">
            <div className="flex items-center gap-3 mb-6 p-3 bg-accent/10 border border-accent/30 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
              <p className="text-sm text-accent">
                Tu contraseña actual es temporal. Crea una contraseña segura para proteger tu cuenta.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand rounded-full" />
                  Nueva Contraseña
                </label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  autoComplete="new-password"
                  aria-invalid={!!error}
                  className="input-modern pr-12 font-mono focus:border-brand focus:shadow-[0_0_0_3px_hsl(var(--brand)/0.15)] focus-ring tap-target-min"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-[40px] text-muted-foreground hover:text-brand transition-colors tap-target-min p-2 focus-ring rounded-lg"
                  aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="space-y-1.5 p-3 bg-muted rounded-xl border border-border">
                  {PASSWORD_RULES.map((rule) => {
                    const passes = rule.test(newPassword);
                    return (
                      <div key={rule.label} className="flex items-center gap-2 text-xs">
                        {passes ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={passes ? 'text-emerald-500' : 'text-muted-foreground'}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand rounded-full" />
                  Confirmar Contraseña
                </label>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  autoComplete="new-password"
                  aria-invalid={!!error || (confirmPassword.length > 0 && !passwordsMatch)}
                  className="input-modern pr-12 font-mono focus:border-brand focus:shadow-[0_0_0_3px_hsl(var(--brand)/0.15)] focus-ring tap-target-min"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-[40px] text-muted-foreground hover:text-brand transition-colors tap-target-min p-2 focus-ring rounded-lg"
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <XIcon className="w-3 h-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <Check className="w-3 h-3" />
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-base py-4 shadow-[0_4px_20px_hsl(var(--brand)/0.4)] tap-target-min focus-ring"
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
  const [accessMode, setAccessMode] = useState<'employee' | 'admin'>('employee');
  const { login, loginByRut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isRutMode = accessMode === 'employee' && looksLikeRut(identifier);

  const changeAccessMode = (mode: 'employee' | 'admin') => {
    setAccessMode(mode);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (accessMode === 'employee') {
      if (!isRutMode) {
        setError('Ingresa un RUT válido, por ejemplo 15.422.822-5.');
        setIsLoading(false);
        return;
      }
      const result = await loginByRut(identifier, password);
      if (result.success) {
        if (result.mustChangePassword) {
          setShowChangePassword(true);
        } else {
          setWelcomeName('loading');
        }
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } else {
      // Login con email + contraseña (admins)
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
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    if (welcomeName === 'loading' && user?.name) {
      setWelcomeName(user.name);
    }
  }, [welcomeName, user?.name]);

  React.useEffect(() => {
    if (welcomeName && welcomeName !== 'loading') {
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [welcomeName, navigate]);

  if (welcomeName && welcomeName !== 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <Confetti />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="orb-orange" style={{ top: '20%', right: '15%' }} />
        <div className="orb-navy" style={{ bottom: '20%', left: '15%' }} />

        <div className="relative z-10 text-center animate-slideUp">
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full bg-brand/20 animate-ping" />
            <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-brand/15 border-2 border-brand/40 animate-pulse-glow animate-pop">
              <Sparkles className="w-12 h-12 text-brand" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-3 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            ¡Bienvenido/a!
          </h1>
          <p className="text-3xl text-brand font-bold mb-2 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {welcomeName}
          </p>
          <p className="text-muted-foreground text-base mt-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>Ingresando a la plataforma...</p>
          <div className="mt-8 w-56 mx-auto h-1.5 bg-muted rounded-full overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="h-full bg-gradient-to-r from-brand to-accent rounded-full animate-fillBar" />
          </div>
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
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Left: industrial split-screen image */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-1/2 relative">
        <img
          src={INDUSTRIAL_IMAGE}
          alt="Seguridad industrial"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="login-hero-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16">
          <div className="animate-fadeIn">
            <SoldesPLogo size={160} className="drop-shadow-lg" />
          </div>

          <div className="space-y-6 animate-slideUp">
            <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1]">
              Capacita<span className="text-brand">Pro</span>
            </h2>
            <p className="text-xl text-white/80 max-w-lg leading-relaxed">
              Capacitación corporativa de alto impacto para la seguridad, calidad y productividad de tu equipo.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span className="text-sm text-white font-medium">HSEQ</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Award className="w-4 h-4 text-brand" />
                <span className="text-sm text-white font-medium">Certificaciones</span>
              </div>
            </div>
          </div>

          <p className="text-white/50 text-sm animate-fadeIn">
            © 2026 SoldesP — Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* Right: floating glass form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/10" />
        <div className="absolute top-0 left-0 w-full h-full bg-dots-pattern" />
        <div className="orb-orange" style={{ top: '8%', right: '8%' }} />
        <div className="orb-navy" style={{ bottom: '12%', left: '5%' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-brand/40 transition-all z-10 focus-ring tap-target-min"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8 animate-fadeIn">
            <div className="inline-flex items-center justify-center mb-5 lg:hidden animate-float">
              <SoldesPLogo size={160} />
            </div>

            <div className="hidden lg:block mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-4 animate-pulse-glow">
                <ShieldCheck className="w-8 h-8 text-brand" />
              </div>
            </div>

            <h1 className="text-4xl font-bold gradient-text mb-2 tracking-tight">CapacitaPro</h1>
            <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              Powered by SoldesP
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">Plataforma de Capacitación Corporativa</p>
          </div>

          <Card className="login-glass p-6 sm:p-8 animate-slideUp">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 rounded-full border border-brand/20 mb-4">
                <Award className="w-4 h-4 text-brand" />
                <span className="text-sm text-brand font-medium">Acceso Rápido</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Bienvenido</h2>
              <p className="text-sm text-muted-foreground">
                {accessMode === 'employee' ? 'Acceso de trabajadores con RUT' : 'Acceso de administración con correo'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 mb-5" role="tablist" aria-label="Tipo de acceso">
              <button
                type="button"
                role="tab"
                aria-selected={accessMode === 'employee'}
                onClick={() => changeAccessMode('employee')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all focus-ring ${accessMode === 'employee' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <UserRound className="w-4 h-4" /> Trabajador
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={accessMode === 'admin'}
                onClick={() => changeAccessMode('admin')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all focus-ring ${accessMode === 'admin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mail className="w-4 h-4" /> Administrador
              </button>
            </div>

            {error && (
              <div id="login-error" role="alert" className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand rounded-full" />
                  {accessMode === 'employee' ? 'RUT' : 'Correo electrónico'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={accessMode === 'employee' ? '15.422.822-5' : 'nombre@empresa.cl'}
                  required
                  autoComplete="username"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="input-modern text-base font-mono focus-ring tap-target-min"
                />
                {isRutMode && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                    RUT reconocido
                  </p>
                )}
              </div>

              <div className="space-y-1 relative">
                  <label className="block text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-4 bg-brand rounded-full" />
                    Contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={accessMode === 'employee' ? 'Contraseña temporal o personal' : 'Tu contraseña'}
                    required
                    autoComplete="current-password"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="input-modern text-base pr-12 font-mono focus-ring tap-target-min"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[40px] text-muted-foreground hover:text-brand transition-colors tap-target-min p-2 focus-ring rounded-lg"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
              </div>

              <Button
                type="submit"
                className="w-full text-base py-4 shadow-[0_4px_20px_hsl(var(--brand)/0.4)] tap-target-min focus-ring"
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
                    Ingresar
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              {accessMode === 'admin' && (
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-brand transition-colors tap-target-min inline-block py-2 px-3 rounded-lg focus-ring"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
              {accessMode === 'employee' && (
                <p className="text-xs text-muted-foreground">
                  En tu primer acceso usa la contraseña temporal entregada por administración; luego deberás cambiarla.
                </p>
              )}
            </div>

            {import.meta.env.DEV && (
              <div className="mt-5 p-4 bg-secondary/10 rounded-xl border border-secondary/30">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  <span className="text-brand font-semibold">Empleado:</span> RUT + contraseña temporal o personal<br />
                  <span className="text-brand font-semibold">Admin:</span> Email + contraseña
                </p>
              </div>
            )}
          </Card>

          <div className="text-center mt-8 animate-fadeIn lg:hidden">
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full border border-brand" />
              © 2026 SoldesP - CapacitaPro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
