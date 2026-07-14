import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'light', showText = true, className = '' }) => {
  const sizes = {
    sm: 'w-16',
    md: 'w-24',
    lg: 'w-32',
    xl: 'w-48'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src="/LOGO-SOLDESP.png" alt="SoldesP" className={`${sizes[size]} h-auto object-contain`} />

      {/* Brand Text */}
      {showText && (
        <span className={`font-bold ${textSizes[size]} ${variant === 'light' ? 'text-white' : 'text-[#001B4B]'}`}>
          CapacitaPro
        </span>
      )}
    </div>
  );
};

export default Logo;
