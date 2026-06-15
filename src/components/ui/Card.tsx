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
    className={`card-modern ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
  const baseStyles = 'font-medium rounded-lg transition-all inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-ghost',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'btn-ghost',
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

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <input
      className={`input-modern ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-red-400">{error}</p>}
  </div>
);

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
    <select
      className={`input-modern ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-700 text-slate-300',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-error',
    info: 'badge-info',
    primary: 'badge-primary'
  };

  return (
    <span className={`badge ${variants[variant]}`}>
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
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`progress-modern ${sizes[size]}`}>
        <div
          className="progress-modern-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-slate-400 mt-1">{Math.round(percentage)}%</p>}
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="relative card-modern max-w-lg w-full p-6 z-10 animate-scaleIn">
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    default: 'bg-[#D15F3D]/15 text-[#D15F3D]',
    primary: 'bg-[#D15F3D]/15 text-[#D15F3D]',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400'
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconColors[variant]}`}>
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
    return <img src={src} alt={name} className={`${sizes[size]} rounded-xl object-cover`} />;
  }

  return (
    <div className={`${sizes[size]} avatar rounded-xl flex items-center justify-center text-white font-semibold`}>
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
  <div className="text-center py-12">
    {icon && (
      <div className="inline-flex p-4 rounded-2xl bg-slate-800 text-slate-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" style={{ width: sizes[size], height: sizes[size] }} />
  );
};

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);