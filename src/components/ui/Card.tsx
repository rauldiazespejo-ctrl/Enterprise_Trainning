// Componentes UI modernos — tema HSL claro/oscuro
import React, { useId } from 'react';
import { AnimatedNumber as AnimatedNumberComponent } from './AnimatedNumber';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'card-modern animate-fadeInUp',
    glass: 'glass-card animate-fadeInUp',
    elevated: 'card-elevated animate-fadeInUp'
  };

  return (
    <div
      className={`${variantClasses[variant]} ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] focus-ring' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

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
    outline: 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 backdrop-blur-sm',
    danger: 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 hover:border-destructive/50',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
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
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-muted-foreground tracking-wide">{label}</label>}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`input-modern transition-all duration-200 ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''} ${className}`}
        {...props}
      />
      {error && <p id={errorId} className="text-sm text-destructive flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-destructive inline-block" />{error}</p>}
    </div>
  );
};

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', id, ...props }) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="space-y-1">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-muted-foreground">{label}</label>}
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
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-muted text-muted-foreground border border-border',
    success: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    warning: 'bg-accent/15 text-accent border border-accent/30',
    danger: 'bg-destructive/15 text-destructive border border-destructive/30',
    info: 'bg-secondary/15 text-secondary border border-secondary/30',
    primary: 'bg-primary/15 text-primary border border-primary/30'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
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
      <div className={`w-full ${sizes[size]} bg-muted rounded-full overflow-hidden`}>
        <div
          className="progress-modern-bar"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && <div className="absolute inset-0 rounded-full bg-primary-foreground/20 animate-shimmer" />}
        </div>
      </div>
      {showLabel && <p className="text-xs text-muted-foreground mt-1.5 font-medium tabular-nums">{Math.round(percentage)}%</p>}
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
        <div className="relative card-modern max-w-lg w-full p-6 z-10 animate-scaleIn">
          {title && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 focus-ring tap-target-min"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  variant = 'default'
}) => {
  const iconColors = {
    default: 'bg-primary/10 text-primary ring-1 ring-primary/20',
    primary: 'bg-primary/10 text-primary ring-1 ring-primary/20',
    success: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
    warning: 'bg-accent/10 text-accent ring-1 ring-accent/20'
  };

  return (
    <Card className="p-5 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-1.5 font-medium flex items-center gap-1 ${trend.positive ? 'text-emerald-500' : 'text-destructive'}`}>
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
        <tr className="border-b border-border">
          {headers.map((header, idx) => (
            <th key={idx} className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
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
    return <img src={src} alt={name} className={`${sizes[size]} rounded-xl object-cover ring-1 ring-foreground/10`} />;
  }

  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center text-primary-foreground font-bold bg-gradient-to-br from-primary to-primary/80 ring-1 ring-foreground/10`}>
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
      <div className="inline-flex p-5 rounded-2xl bg-muted text-muted-foreground mb-5 ring-1 ring-border">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>}
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
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-muted border-t-primary`} />
  );
};

// Skeleton Loader Component
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton-premium ${className}`} />
);

export * from './AnimatedNumber';
