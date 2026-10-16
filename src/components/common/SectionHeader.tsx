import React from 'react';
import { BrandBars } from './BrandBars';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  lightBg?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  badge,
  className = '',
  lightBg = false,
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <BrandBars size="sm" variant={lightBg ? 'light-bg' : 'standard'} />
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`font-display font-bold text-base sm:text-lg tracking-wide uppercase ${
                lightBg ? 'text-[#0A1428]' : 'text-white'
              }`}
            >
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className={`text-xs mt-0.5 font-body ${lightBg ? 'text-[#3D4757]' : 'text-[#C3CBDA]'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
