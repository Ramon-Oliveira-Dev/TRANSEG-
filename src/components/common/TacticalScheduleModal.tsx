import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Clock, 
  Check, 
  Sparkles,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { Logo } from './Logo';
import { useBackHandler } from '../../hooks/useBackHandler';

interface TacticalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  value?: string; // Formato ISO "YYYY-MM-DDTHH:mm"
  onConfirm: (dateTimeStr: string, isImmediate?: boolean) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const QUICK_MINUTES = [0, 15, 30, 45];

export const TacticalScheduleModal: React.FC<TacticalScheduleModalProps> = ({
  isOpen,
  onClose,
  value,
  onConfirm,
}) => {
  const now = useMemo(() => new Date(), [isOpen]);

  // Botão nativo de voltar do dispositivo fecha o modal de agendamento rápido
  useBackHandler({
    id: 'tactical-schedule-modal',
    active: isOpen,
    onBack: onClose
  });
  
  // Year, month, day are locked to TODAY (same day)
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Selected hour and minute for TODAY
  const [selectedHour, setSelectedHour] = useState<number>(() => {
    return currentHour < 23 ? currentHour + 1 : 23;
  });
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  // Initialize state when opening
  useEffect(() => {
    if (!isOpen) return;

    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedHour(parsed.getHours());
        setSelectedMinute(parsed.getMinutes());
        return;
      }
    }

    // Default: Next available hour today or +30 min
    const defaultTime = new Date(Date.now() + 30 * 60 * 1000);
    setSelectedHour(defaultTime.getHours());
    setSelectedMinute(defaultTime.getMinutes() >= 30 ? 30 : 0);
  }, [isOpen, value]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Available hours for today (from current hour up to 23)
  const availableHoursToday = [];
  for (let h = currentHour; h < 24; h++) {
    availableHoursToday.push(h);
  }

  // Quick Preset Helper for today
  const applyPresetMinutes = (extraMinutes: number) => {
    const target = new Date(Date.now() + extraMinutes * 60 * 1000);
    // Keep within today
    if (target.getDate() !== todayDate) {
      setSelectedHour(23);
      setSelectedMinute(45);
    } else {
      setSelectedHour(target.getHours());
      setSelectedMinute(target.getMinutes());
    }
  };

  const getTodayIsoString = (h: number, m: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${todayYear}-${pad(todayMonth + 1)}-${pad(todayDate)}T${pad(h)}:${pad(m)}`;
  };

  const handleConfirmSelected = () => {
    onConfirm(getTodayIsoString(selectedHour, selectedMinute), false);
    onClose();
  };

  const handleChooseImmediate = () => {
    onConfirm('', true);
    onClose();
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const todayFormatted = `${WEEKDAY_NAMES[now.getDay()]}, ${pad(todayDate)} de ${MONTH_NAMES[todayMonth]} de ${todayYear}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Definir horário de atendimento para o mesmo dia"
      className="fixed inset-0 z-50 bg-[#060D1B]/95 backdrop-blur-2xl flex flex-col justify-between h-[100dvh] max-h-[100dvh] overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Malha tática e iluminação ambiental com gradiente */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-gradient-to-b from-[#16264A]/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FFC20E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#16264A]/40 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOPO DA TELA (Logo TRANSEG + Fechar) */}
      <div className="relative z-10 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#16264A]/70 bg-[#060D1B]/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo size="header" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#11203D]/70 border border-[#1E335C]/60 text-[10px] text-[#8E9BAE] font-mono uppercase tracking-wider backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC20E] animate-pulse" />
            <span>Atendimento Hoje</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar seletor de horários"
          className="w-9 h-9 rounded-full bg-[#11203D] hover:bg-[#16264A] active:scale-95 text-white/90 hover:text-white border border-[#1E335C] hover:border-[#FFC20E]/50 flex items-center justify-center transition-all shadow-md focus:outline-none cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. CORPO DO SELETOR: HORÁRIOS PARA O MESMO DIA (Hoje) */}
      <div className="relative z-10 flex-1 flex flex-col max-w-lg w-full mx-auto px-4 sm:px-6 py-3 sm:py-4 min-h-0 overflow-y-auto custom-scrollbar space-y-3">
        
        {/* Cabeçalho */}
        <div className="shrink-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#FFC20E] uppercase tracking-wider mb-0.5 font-display">
            <Sparkles className="w-3 h-3 text-[#FFC20E]" />
            <span>SOLICITAÇÃO DE SERVIÇO • MESMO DIA</span>
          </div>
          <h2 className="font-brand-title font-extrabold text-xl sm:text-2xl text-white uppercase tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Horários para Hoje
          </h2>

          {/* Banner de Data Fixa de Hoje */}
          <div className="mt-2 p-3 rounded-[10px] bg-gradient-to-r from-[#11203D]/90 via-[#0E1A33]/90 to-[#0A1428]/95 border border-[#FFC20E]/40 backdrop-blur-md flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[8px] bg-[#FFC20E]/15 border border-[#FFC20E]/30 flex items-center justify-center text-[#FFC20E] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#8E9BAE] block uppercase font-mono tracking-wider">
                  Data Operacional:
                </span>
                <span className="font-semibold text-xs sm:text-sm text-white truncate block">
                  {todayFormatted}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-[#8E9BAE] block uppercase">Horário:</span>
              <span className="font-mono text-sm font-bold text-[#FFC20E]">
                {pad(selectedHour)}:{pad(selectedMinute)}
              </span>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos para o Mesmo Dia */}
        <div className="shrink-0">
          <span className="text-[10px] text-[#8E9BAE] uppercase font-mono tracking-wider block mb-1.5">
            Atalhos para hoje:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={handleChooseImmediate}
              className="py-1.5 px-2 rounded-[6px] bg-[#FFC20E] hover:bg-[#E5A800] text-[#060D1B] text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <Zap className="w-3 h-3 text-[#060D1B]" />
              <span>Agora</span>
            </button>
            <button
              type="button"
              onClick={() => applyPresetMinutes(15)}
              className="py-1.5 px-2 rounded-[6px] bg-[#11203D]/80 hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-white text-[11px] font-mono transition-all cursor-pointer text-center"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => applyPresetMinutes(30)}
              className="py-1.5 px-2 rounded-[6px] bg-[#11203D]/80 hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-white text-[11px] font-mono transition-all cursor-pointer text-center"
            >
              +30 min
            </button>
            <button
              type="button"
              onClick={() => applyPresetMinutes(60)}
              className="py-1.5 px-2 rounded-[6px] bg-[#11203D]/80 hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-white text-[11px] font-mono transition-all cursor-pointer text-center"
            >
              +1 hora
            </button>
            <button
              type="button"
              onClick={() => applyPresetMinutes(120)}
              className="py-1.5 px-2 rounded-[6px] bg-[#11203D]/80 hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-white text-[11px] font-mono transition-all cursor-pointer text-center"
            >
              +2 horas
            </button>
          </div>
        </div>

        {/* Seleção de Hora para Hoje */}
        <div className="p-3.5 rounded-[12px] bg-[#0E1A33]/70 border border-[#1E335C] backdrop-blur-md shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FFC20E]" />
              <span>Horário Restante de Hoje:</span>
            </span>
            <span className="text-[10px] font-mono text-[#8E9BAE]">
              A partir de agora ({pad(currentHour)}:{pad(currentMinute)})
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
            {availableHoursToday.map((h) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={`h-${h}`}
                  type="button"
                  onClick={() => setSelectedHour(h)}
                  className={`py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_12px_rgba(255,194,14,0.35)] scale-102'
                      : 'bg-[#11203D]/70 hover:bg-[#16264A] text-[#C3CBDA] hover:text-white border border-[#1E335C]/60'
                  }`}
                >
                  <span>{pad(h)}:00</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seleção de Minutos para Hoje */}
        <div className="p-3.5 rounded-[12px] bg-[#0E1A33]/70 border border-[#1E335C] backdrop-blur-md shadow-md space-y-2">
          <span className="font-display font-bold text-xs text-white uppercase tracking-wider block">
            Minuto Exato:
          </span>

          <div className="grid grid-cols-4 gap-2">
            {QUICK_MINUTES.map((m) => {
              const isSelected = selectedMinute === m;
              return (
                <button
                  key={`min-${m}`}
                  type="button"
                  onClick={() => setSelectedMinute(m)}
                  className={`py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_12px_rgba(255,194,14,0.35)]'
                      : 'bg-[#11203D]/70 hover:bg-[#16264A] text-[#C3CBDA] hover:text-white border border-[#1E335C]/60'
                  }`}
                >
                  :{pad(m)} min
                </button>
              );
            })}
          </div>
        </div>

        {/* Nota Tática sobre Pronta-Resposta */}
        <div className="p-2.5 rounded-[8px] bg-[#11203D]/40 border border-[#1E335C]/40 text-[11px] text-[#8E9BAE] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FFC20E] shrink-0" />
          <span>Atendimento operacional exclusivo para hoje com prioridade de despacho na rota.</span>
        </div>
      </div>

      {/* 3. RODAPÉ (Imediato, Cancelar, Confirmar Horário) */}
      <div className="relative z-10 px-4 sm:px-6 py-3 border-t border-[#16264A]/70 bg-[#060D1B]/95 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={handleChooseImmediate}
          className="btn-ghost-dark !px-3 !py-2 text-xs text-[#FFC20E] hover:text-white flex items-center gap-1 cursor-pointer font-semibold"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Chamar Imediato</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-[8px] bg-[#11203D] hover:bg-[#16264A] text-xs font-semibold text-[#C3CBDA] hover:text-white border border-[#1E335C] transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmSelected}
            className="btn-yellow !px-5 !py-2 text-xs font-bold shadow-[0_0_16px_rgba(255,194,14,0.35)] flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Confirmar Horário</span>
          </button>
        </div>
      </div>
    </div>
  );
};
