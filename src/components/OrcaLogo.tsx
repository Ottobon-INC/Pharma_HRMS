import React from 'react';

export interface OrcaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'stacked';
  subtitle?: string;
  onClick?: () => void;
}

export const OrcaLogo: React.FC<OrcaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'dark',
  layout = 'horizontal',
  subtitle = 'Pharma HRMS',
  onClick,
}) => {
  // Dimension scales
  const horizontalSizes = {
    xs: { img: 'w-6 h-6', text: 'text-sm', sub: 'text-[8px]' },
    sm: { img: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-12 h-12', text: 'text-xl', sub: 'text-xs' },
    xl: { img: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },
  };

  const stackedSizes = {
    xs: { img: 'h-10', sub: 'text-[9px]' },
    sm: { img: 'h-14', sub: 'text-[10px]' },
    md: { img: 'h-20', sub: 'text-xs' },
    lg: { img: 'h-28', sub: 'text-xs' },
    xl: { img: 'h-36', sub: 'text-sm' },
  };

  const isDark = variant === 'dark';

  // Stacked layout (ideal for Login screen, splash, modals)
  if (layout === 'stacked') {
    const sSize = stackedSizes[size];
    const logoSrc = isDark ? '/orca-logo-dark.png' : '/orca-logo.png';

    return (
      <div 
        className={`flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <img
          src={logoSrc}
          alt="Orca Labs Logo"
          className={`${sSize.img} w-auto object-contain drop-shadow-md transition-transform duration-200 hover:scale-[1.02]`}
        />
        {showText && subtitle && (
          <span
            className={`font-semibold tracking-widest uppercase mt-2 ${sSize.sub} ${
              isDark ? 'text-teal-400/90' : 'text-teal-700'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Horizontal layout (ideal for headers, sidebars, compact bars)
  const hSize = horizontalSizes[size];

  return (
    <div 
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`relative flex items-center justify-center shrink-0 ${hSize.img}`}>
        <img
          src="/orca-emblem.png"
          alt="Orca Labs Emblem"
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 hover:scale-105"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center tracking-wider">
            <span
              className={`font-black uppercase font-sans ${hSize.text} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              ORCA
            </span>
            <span
              className={`font-extrabold uppercase font-sans ml-1.5 ${hSize.text} ${
                isDark ? 'text-teal-400' : 'text-teal-600'
              }`}
            >
              LABS
            </span>
          </div>
          {subtitle && (
            <span
              className={`font-bold tracking-widest uppercase mt-0.5 ${hSize.sub} ${
                isDark ? 'text-teal-300/80' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
