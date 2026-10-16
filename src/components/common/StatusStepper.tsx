import React from 'react';
import { Check, Clock, Shield, Navigation, Play, CheckCircle2, XCircle } from 'lucide-react';
import { ServiceStatus } from '../../types';

interface StatusStepperProps {
  currentStatus: ServiceStatus;
  className?: string;
}

const STEPS: { status: ServiceStatus; label: string; icon: React.ElementType }[] = [
  { status: 'Pendente', label: 'Pendente', icon: Clock },
  { status: 'Atribuído', label: 'Atribuído', icon: Shield },
  { status: 'A caminho', label: 'A caminho', icon: Navigation },
  { status: 'Em andamento', label: 'Em andamento', icon: Play },
  { status: 'Concluído', label: 'Concluído', icon: CheckCircle2 },
];

export const StatusStepper: React.FC<StatusStepperProps> = ({ currentStatus, className = '' }) => {
  if (currentStatus === 'Cancelado') {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-[8px] flex items-center gap-3 text-[#DC2626] ${className}`}>
        <XCircle className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-display font-bold text-sm block">Solicitação Cancelada</span>
          <span className="text-xs text-[#3D4757] dark:text-[#C3CBDA]">Este pedido foi cancelado antes do início da operação.</span>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex(s => s.status === currentStatus);

  return (
    <div className={`w-full py-2 font-body ${className}`}>
      {/* Stepper responsivo */}
      <div className="relative flex items-center justify-between">
        {/* Linha de fundo */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#DDE1E8] dark:bg-[#16264A] -z-0" />
        
        {/* Linha de progresso ativa */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#FFC20E] transition-all duration-300 -z-0"
          style={{ 
            width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` 
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#FFC20E] text-[#060D1B] ring-4 ring-[#FFC20E]/20 scale-110 shadow-md font-bold'
                    : isCompleted
                    ? 'bg-[#0A1428] text-[#FFC20E] border-2 border-[#FFC20E]'
                    : 'bg-[#F3F4F6] dark:bg-[#0A1428] text-[#8E9BAE] border border-[#DDE1E8] dark:border-[#16264A]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1.5 font-medium text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-[#0A1428] dark:text-white font-bold'
                    : isCompleted
                    ? 'text-[#3D4757] dark:text-[#C3CBDA]'
                    : 'text-[#8E9BAE]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
