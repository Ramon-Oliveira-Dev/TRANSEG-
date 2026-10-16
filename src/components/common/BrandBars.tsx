import React from 'react';

export interface BrandBarsProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'header';
  variant?: 'standard' | 'alternate' | 'light-bg';
  className?: string;
  animated?: boolean;
}

/**
 * Componente oficial das 3 Barras Inclinadas da TRANSEG (///)
 * Conforme Screenshot_20261013-091939.png:
 * As 3 barras são amarelas vibrantes (#FFC20E) com inclinação diagonal característica.
 */
export const BrandBars: React.FC<BrandBarsProps> = ({
  size = 'md',
  variant = 'standard',
  className = '',
  animated = false,
}) => {
  const sizeConfig = {
    sm: { width: 'w-[3.5px] sm:w-[4px]', height: 'h-[18px] sm:h-[20px]', gap: 'gap-[3px]' },
    header: { width: 'w-[4.5px] sm:w-[5px]', height: 'h-[22px] sm:h-[24px]', gap: 'gap-[3.5px]' },
    md: { width: 'w-[4.5px] sm:w-[5px]', height: 'h-[22px] sm:h-[24px]', gap: 'gap-[3.5px]' },
    lg: { width: 'w-2 sm:w-2.5', height: 'h-8 sm:h-9', gap: 'gap-1.5' },
    xl: { width: 'w-3 sm:w-3.5', height: 'h-11 sm:h-12', gap: 'gap-2' },
    hero: { width: 'w-4 sm:w-5 md:w-6', height: 'h-16 sm:h-20 md:h-24', gap: 'gap-2.5 sm:gap-3.5' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // No padrão oficial da logo (Screenshot_20261013-091939.png), todas as 3 barras são amarelas ouro (#FFC20E)
  const isAlternate = variant === 'alternate';
  const middleBarColor = isAlternate ? 'bg-[#0F1C38]' : 'bg-[#FFC20E]';

  return (
    <div
      className={`inline-flex items-center ${config.gap} select-none brand-bars ${className}`}
      aria-hidden="true"
    >
      {/* Barra 1 */}
      <span
        className={`${config.width} ${config.height} bg-gradient-to-b from-[#FFE04D] via-[#FFC20E] to-[#F0A500] rounded-[1.5px] transform -skew-x-[18deg] shrink-0 shadow-[0_0_8px_rgba(255,194,14,0.35)] ${
          animated ? 'animate-bar-1 origin-bottom' : ''
        }`}
      />
      {/* Barra 2 */}
      <span
        className={`${config.width} ${config.height} ${
          isAlternate
            ? `${middleBarColor} border border-[#FFC20E]/30`
            : 'bg-gradient-to-b from-[#FFE04D] via-[#FFC20E] to-[#F0A500] shadow-[0_0_8px_rgba(255,194,14,0.4)]'
        } rounded-[1.5px] transform -skew-x-[18deg] shrink-0 ${
          animated ? 'animate-bar-2 origin-bottom' : ''
        }`}
      />
      {/* Barra 3 */}
      <span
        className={`${config.width} ${config.height} bg-gradient-to-b from-[#FFE04D] via-[#FFC20E] to-[#F0A500] rounded-[1.5px] transform -skew-x-[18deg] shrink-0 shadow-[0_0_8px_rgba(255,194,14,0.35)] ${
          animated ? 'animate-bar-3 origin-bottom' : ''
        }`}
      />
    </div>
  );
};
