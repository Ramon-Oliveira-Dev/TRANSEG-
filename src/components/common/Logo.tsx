import React from 'react';
import { BrandBars } from './BrandBars';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'header';
  showSubtitle?: boolean;
  animated?: boolean;
  className?: string;
  lightBg?: boolean;
}

/**
 * Logotipo Oficial TRANSEG — Fiel a Screenshot_20261013-091939.png
 * - Três barras inclinadas amarelas ouro (#FFC20E) à esquerda
 * - Wordmark "TRANSEG" em caixa alta, negrito, itálico com a fonte exata Chakra Petch
 * - Subtítulo "TECNOLOGIAS DE SEGURANÇA" perfeitamente alinhado e espaçado (tracking)
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  animated = false,
  className = '',
  lightBg = false,
}) => {
  const sizeMap = {
    sm: {
      barSize: 'sm' as const,
      gap: 'gap-2',
      titleClass: 'text-[17px] sm:text-[19px]',
      subtitleClass: 'text-[6.5px] sm:text-[7px] tracking-[0.24em] mt-[2px]',
    },
    header: {
      barSize: 'header' as const,
      gap: 'gap-2.5 sm:gap-3',
      titleClass: 'text-[20px] sm:text-[22px]',
      subtitleClass: 'text-[7.5px] sm:text-[8px] tracking-[0.28em] mt-[3px]',
    },
    md: {
      barSize: 'header' as const,
      gap: 'gap-2.5 sm:gap-3',
      titleClass: 'text-[20px] sm:text-[22px]',
      subtitleClass: 'text-[7.5px] sm:text-[8px] tracking-[0.28em] mt-[3px]',
    },
    lg: {
      barSize: 'lg' as const,
      gap: 'gap-3.5 sm:gap-4',
      titleClass: 'text-3xl sm:text-4xl tracking-[0.03em]',
      subtitleClass: 'text-[10px] sm:text-[11px] tracking-[0.3em] mt-1',
    },
    xl: {
      barSize: 'xl' as const,
      gap: 'gap-4 sm:gap-5',
      titleClass: 'text-4xl sm:text-5xl tracking-[0.04em]',
      subtitleClass: 'text-xs sm:text-sm tracking-[0.32em] mt-1.5',
    },
    hero: {
      barSize: 'hero' as const,
      gap: 'gap-5 sm:gap-7 md:gap-8',
      titleClass: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.04em]',
      subtitleClass: 'text-xs sm:text-sm md:text-base lg:text-lg tracking-[0.36em] sm:tracking-[0.42em] mt-2 sm:mt-3',
    },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center ${selectedSize.gap} select-none ${className}`}>
      {/* 1. Motivo gráfico assinatura: Três barras inclinadas amarelas ouro (#FFC20E) */}
      <BrandBars
        size={selectedSize.barSize}
        variant="standard"
        animated={animated}
      />

      {/* 2. Wordmark Oficial e Subtítulo */}
      <div className="flex flex-col justify-center leading-none text-left">
        {/* TRANSEG: Bold, Italic, Chakra Petch, Branco puro */}
        <span
          className={`font-chakra font-bold italic select-none ${
            lightBg ? 'text-[#0A1428]' : 'text-white'
          } ${selectedSize.titleClass}`}
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: '0.02em',
          }}
        >
          TRANSEG
        </span>

        {/* TECNOLOGIAS DE SEGURANÇA: Caixa alta, Chakra Petch normal, Espaçamento amplo */}
        {showSubtitle && (
          <span
            className={`font-chakra font-semibold uppercase select-none ${
              lightBg ? 'text-[#3D4757]' : 'text-white/95'
            } ${selectedSize.subtitleClass}`}
            style={{
              fontFamily: "'Chakra Petch', 'Barlow', sans-serif",
            }}
          >
            TECNOLOGIAS DE SEGURANÇA
          </span>
        )}
      </div>
    </div>
  );
};
