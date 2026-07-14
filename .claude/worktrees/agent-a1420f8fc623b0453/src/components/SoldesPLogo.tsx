import React from 'react';

interface SoldesPLogoProps {
  size?: number;
  className?: string;
}

const logoSrc = '/LOGO-SOLDESP.png';

const BrandImage: React.FC<SoldesPLogoProps> = ({ size = 80, className = '' }) => (
  <img
    src={logoSrc}
    alt="SoldesP"
    width={size}
    className={`h-auto object-contain ${className}`}
  />
);

export const SoldesPLogo = BrandImage;
export const SoldesPLogoSmall = BrandImage;
export const SoldesPCertificateLogo = BrandImage;

export default SoldesPLogo;
