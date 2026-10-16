import React from 'react';
import { ServiceStatus } from '../../types';

interface StatusBadgeProps {
  status: ServiceStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  /**
   * Configuração exata do Design System TRANSEG:
   * - pendente: em --text-light / cinza
   * - atribuído: azul/navy sutil dentro da paleta
   * - a_caminho / em_andamento: em --yellow com texto --navy-deep
   * - concluído: em verde de sistema (--success: #16A34A)
   * - cancelado: em --danger (#DC2626)
   */
  const statusConfig: Record<
    ServiceStatus, 
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    'Pendente': {
      label: 'Pendente',
      bg: 'bg-[#DDE1E8]/60 dark:bg-[#16264A]/60',
      text: 'text-[#3D4757] dark:text-[#C3CBDA]',
      border: 'border-[#DDE1E8] dark:border-[#16264A]',
      dot: 'bg-[#8E9BAE]',
    },
    'Atribuído': {
      label: 'Atribuído',
      bg: 'bg-[#0A1428]/10 dark:bg-[#0F1C38]',
      text: 'text-[#0A1428] dark:text-[#C3CBDA]',
      border: 'border-[#0A1428]/20 dark:border-[#16264A]',
      dot: 'bg-[#0A1428] dark:bg-[#C3CBDA]',
    },
    'A caminho': {
      label: 'A caminho',
      bg: 'bg-[#FFC20E]',
      text: 'text-[#060D1B] font-bold',
      border: 'border-[#FFC20E]',
      dot: 'bg-[#060D1B]',
    },
    'Em andamento': {
      label: 'Em andamento',
      bg: 'bg-[#FFC20E]',
      text: 'text-[#060D1B] font-bold',
      border: 'border-[#FFC20E]',
      dot: 'bg-[#060D1B] animate-pulse',
    },
    'Concluído': {
      label: 'Concluído',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-[#16A34A] dark:text-emerald-400 font-semibold',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-[#16A34A]',
    },
    'Cancelado': {
      label: 'Cancelado',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-[#DC2626] dark:text-red-400 font-semibold',
      border: 'border-red-200 dark:border-red-800/60',
      dot: 'bg-[#DC2626]',
    },
  };

  const config = statusConfig[status] || statusConfig['Pendente'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[6px] border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};
