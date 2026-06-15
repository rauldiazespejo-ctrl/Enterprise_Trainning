// Página de Login - Premium Dark Theme con logo original SoldesP
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button } from '@/components/ui/Card';
import { Eye, EyeOff, Sparkles, Award } from 'lucide-react';
import { SoldesPLogo } from '@/components/SoldesPLogo';
import { employeeEmailFromRut, isValidRut, normalizeRut } from '@/lib/employeeImport';

// Detecta si el valor ingresado es un RUT chileno
const looksLikeRut = (value: string): boolean =>
  /^\d{7,8}-?[\dkK]$/.test(value.replace(/\./g, '').replace(/\s/g, '')) ||
  /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(value.trim());

// Convierte RUT a email de acceso si es válido; devuelve el valor original si no
const resolveLoginEmail = (value: string): string => {
  if (looksLikeRut(value)) {
    const normalized = normalizeRut(value);
    if (isValidRut(normalized)) return employeeEmailFromRut(normalized);
  }
  return value.trim();
};

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isRutMode = looksLikeRut(identifier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = resolveLoginEmail(identifier);
    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects - SoldesP Brand Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E1A] via-[#111827] to-[#001B4B] opacity-80" />
      <div className="absolute top-0 left-0 w-full h-full bg-dots-pattern" />

      {/* Decorative Orbs */}
      <div className="orb-orange" style={{ top: '10%', left: '5%' }} />
      <div className="orb-navy" style={{ bottom: '15%', right: '10%' }} />
      <div className="orb-orange" style={{ bottom: '40%', left: '30%', width: '200px', height: '200px' }} />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header - Logo Original SoldesP */}
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

        {/* Login Card - Premium Glass Effect */}
        <Card className="p-8 backdrop-blur-xl bg-[rgba(17,24,39,0.9)] border border-[rgba(209,95,61,0.2)] shadow-2xl animate-slideUp">
          {/* Card Header */}
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[#334155] bg-[#1F2937] text-[#D15F3D] focus:ring-[#D15F3D] focus:ring-offset-0 cursor-pointer" />
                <span className="text-[#9CA3AF] group-hover:text-[#D1D5DB] transition-colors">Recordarme</span>
              </label>
              <a href="#" className="text-[#D15F3D] hover:text-[#E87A58] transition-colors font-medium">¿Olvidaste tu contraseña?</a>
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

          <div className="mt-5 p-4 bg-[rgba(0,27,75,0.2)] rounded-xl border border-[rgba(0,27,75,0.4)]">
            <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
              <span className="text-[#D15F3D] font-semibold">Usuario:</span> RUT con dígito verificador — <span className="font-mono">15422822-5</span><br />
              <span className="text-[#D15F3D] font-semibold">Contraseña:</span> RUT sin dígito verificador — <span className="font-mono">15422822</span>
            </p>
          </div>
        </Card>

        {/* Footer */}
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
