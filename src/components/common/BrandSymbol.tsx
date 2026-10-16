import React from 'react';

interface BrandSymbolProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 'md',
  animated = false,
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      container: 'h-5 gap-1',
      barWidth: 'w-1.5',
    },
    md: {
      container: 'h-6 sm:h-7 gap-1 sm:gap-1.5',
      barWidth: 'w-2 sm:w-2.5',
    },
    lg: {
      container: 'h-8 sm:h-9 gap-2',
      barWidth: 'w-2 sm:w-2.5',
    },
    xl: {
      container: 'h-12 sm:h-14 md:h-16 gap-2.5 sm:gap-3',
      barWidth: 'w-3 sm:w-3.5 md:w-4',
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`relative inline-flex items-center ${config.container} select-none ${className}`}
      aria-hidden="true"
    >
      {/* Barra 1: Amarelo Ouro Oficial */}
      <span
        className={`h-full ${config.barWidth} bg-gradient-to-b from-[#FFE382] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_10px_rgba(255,194,14,0.45)] ${
          animated ? 'animate-bar-1 origin-bottom' : ''
        }`}
      />
      {/* Barra 2: Amarelo Ouro Oficial */}
      <span
        className={`h-full ${config.barWidth} bg-gradient-to-b from-[#FFE382] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_12px_rgba(255,194,14,0.55)] ${
          animated ? 'animate-bar-2 origin-bottom' : ''
        }`}
      />
      {/* Barra 3: Amarelo Ouro Oficial */}
      <span
        className={`h-full ${config.barWidth} bg-gradient-to-b from-[#FFE382] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_10px_rgba(255,194,14,0.45)] ${
          animated ? 'animate-bar-3 origin-bottom' : ''
        }`}
      />
    </div>
  );
};
