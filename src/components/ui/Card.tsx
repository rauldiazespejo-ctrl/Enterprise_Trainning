// Componentes UI modernos - Dark Theme
import React from 'react';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`card-modern animate-fadeInUp ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 active:scale-[0.97]';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'border border-slate-600 text-slate-300 hover:border-[#D15F3D]/50 hover:text-white hover:bg-white/[0.04] backdrop-blur-sm',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50',
    ghost: 'text-slate-400 hover:text-white hover:bg-white/[0.06]',
    accent: 'btn-accent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 tracking-wide">{label}</label>}
      <input
        id={inputId}
        className={`input-modern transition-all duration-200 ${error ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{error}</p>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div className="space-y-1">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-slate-300">{label}</label>}
      <select
        id={selectId}
        className={`input-modern ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-700/60 text-slate-300 border border-slate-600/50',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    primary: 'bg-[#D15F3D]/15 text-[#D15F3D] border border-[#D15F3D]/30'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, showLabel = false, size = 'md', className = '' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${sizes[size]} bg-slate-800 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D15F3D] to-[#E87A58] transition-all duration-500 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && <div className="absolute inset-0 rounded-full bg-white/20 animate-shimmer" />}
        </div>
      </div>
      {showLabel && <p className="text-xs text-slate-400 mt-1.5 font-medium tabular-nums">{Math.round(percentage)}%</p>}
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative card-modern max-w-lg w-full p-6 z-10 animate-scaleIn border-white/[0.08]">
          {title && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, variant = 'default' }) => {
  const iconColors = {
    default: 'bg-[#D15F3D]/10 text-[#D15F3D] ring-1 ring-[#D15F3D]/20',
    primary: 'bg-[#D15F3D]/10 text-[#D15F3D] ring-1 ring-[#D15F3D]/20',
    success: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
  };

  return (
    <Card className="p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
          {trend && (
            <p className={`text-sm mt-1.5 font-medium flex items-center gap-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className={`inline-block transition-transform ${trend.positive ? 'rotate-0' : 'rotate-180'}`}>↑</span>
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconColors[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Table Component
interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-700">
          {headers.map((header, idx) => (
            <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

// Avatar Component
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-xl object-cover ring-1 ring-white/10`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-br from-[#D15F3D] to-[#B34E2D] ring-1 ring-white/10`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="text-center py-16 animate-fadeIn">
    {icon && (
      <div className="inline-flex p-5 rounded-2xl bg-slate-800/50 text-slate-400 mb-5 ring-1 ring-white/[0.06]">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    {description && <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-700 border-t-[#D15F3D]`} />
  );
};

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton-premium ${className}`} />
);