import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  Search, 
  ChevronRight, 
  ChevronsUpDown,
  Sparkles,
  Shield
} from 'lucide-react';
import { Logo } from './Logo';

export interface FullscreenSelectOption {
  value: string;
  label: string;
  description?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'gold' | 'green' | 'blue' | 'red' | 'gray';
  disabled?: boolean;
}

interface FullscreenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  options: FullscreenSelectOption[];
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const FullscreenSelectModal: React.FC<FullscreenSelectModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow = 'TRANSEG TÁTICO · SELEÇÃO',
  options,
  selectedValue,
  onSelect,
  searchable = false,
  searchPlaceholder = 'Buscar opção...',
  emptyMessage = 'Nenhuma opção encontrada.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(term) ||
      (opt.description && opt.description.toLowerCase().includes(term)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
      (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  if (!isOpen) return null;

  const handleSelectOption = (opt: FullscreenSelectOption) => {
    if (opt.disabled) return;
    onSelect(opt.value);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-[#060D1B] flex flex-col justify-between h-[100dvh] max-h-[100dvh] overflow-hidden select-none animate-in fade-in duration-200 selection:bg-[#FFC20E] selection:text-[#0A1428]"
    >
      {/* Malha de fundo tática sutil */}
      <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

      {/* Gradientes e reflexos de glassmorphism */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-[#16264A]/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFC20E]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#16264A]/40 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOPO DA TELA CHEIA (Logo TRANSEG + Fechar) */}
      <div className="relative z-10 px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#16264A]/70 bg-[#060D1B]/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="header" />
          <div className="hidden min-[420px]:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#11203D]/60 border border-[#1E335C]/60 text-[10px] text-[#8E9BAE] font-mono uppercase tracking-wider backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC20E] animate-pulse" />
            <span>Seleção Tática</span>
          </div>
        </div>

        {/* Botão de Fechar Circular com 'X' */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela de seleção"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#11203D] hover:bg-[#16264A] active:scale-95 text-white/90 hover:text-white border border-[#1E335C] hover:border-[#FFC20E]/50 flex items-center justify-center transition-all shadow-md focus:outline-none cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. CORPO CENTRAL DA SELEÇÃO EM TELA CHEIA (Glassmorphism + Gradientes) */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0 overflow-hidden">
        {/* Cabeçalho do modal */}
        <div className="mb-4 sm:mb-5 shrink-0 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-[#FFC20E] uppercase tracking-[0.16em] mb-1 font-display">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC20E]" />
            <span>{eyebrow}</span>
          </div>
          <h2 className="font-brand-title font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#8E9BAE] mt-1 max-w-lg font-body">
              {subtitle}
            </p>
          )}
        </div>

        {/* Barra de pesquisa opcional */}
        {searchable && (
          <div className="mb-3 sm:mb-4 shrink-0 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#0E1A33]/80 hover:bg-[#11203D] border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none backdrop-blur-md transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 p-1 text-[#8E9BAE] hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista rolável de opções em cards com Glassmorphism */}
        <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 pr-1 sm:pr-2 custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="p-8 text-center rounded-[12px] bg-[#0E1A33]/50 border border-[#1E335C]/60 backdrop-blur-md my-6">
              <Shield className="w-8 h-8 text-[#8E9BAE]/60 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-[#8E9BAE]">{emptyMessage}</p>
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedValue === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={opt.disabled}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-[12px] border transition-all cursor-pointer flex items-center justify-between gap-3 sm:gap-4 backdrop-blur-md relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FFC20E]/20 via-[#16264A]/90 to-[#0A1428]/95 border-[#FFC20E] text-white shadow-[0_4px_24px_rgba(255,194,14,0.2)] ring-1 ring-[#FFC20E]/40'
                      : opt.disabled
                      ? 'bg-[#0E1A33]/30 border-[#1E335C]/30 text-[#8E9BAE]/50 cursor-not-allowed opacity-60'
                      : 'bg-[#0E1A33]/70 hover:bg-[#13254A]/80 border-[#1E335C]/80 hover:border-[#FFC20E]/50 text-[#C3CBDA] hover:text-white'
                  }`}
                >
                  {/* Brilho decorativo no card ativo */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC20E]/10 rounded-full blur-2xl pointer-events-none" />
                  )}

                  {/* Conteúdo à esquerda: Ícone + Título + Descrição */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    {/* Contêiner de ícone */}
                    {opt.icon && (
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[#FFC20E] text-[#060D1B] border-[#FFC20E] shadow-md'
                            : 'bg-[#11203D] text-[#FFC20E] border-[#1E335C] group-hover:border-[#FFC20E]/40'
                        }`}
                      >
                        {opt.icon}
                      </div>
                    )}

                    {/* Textos */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-display font-bold text-sm sm:text-base tracking-wide transition-colors ${
                            isSelected
                              ? 'text-[#FFC20E]'
                              : 'text-white group-hover:text-[#FFC20E]'
                          }`}
                        >
                          {opt.label}
                        </span>

                        {opt.badge && (
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] border ${
                              opt.badgeColor === 'green'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50'
                                : opt.badgeColor === 'red'
                                ? 'bg-red-950/80 text-red-400 border-red-700/50'
                                : opt.badgeColor === 'blue'
                                ? 'bg-blue-950/80 text-blue-400 border-blue-700/50'
                                : 'bg-[#FFC20E]/10 text-[#FFC20E] border-[#FFC20E]/30'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      {opt.sublabel && (
                        <div className="text-[11px] text-[#FFC20E]/80 font-mono mt-0.5">
                          {opt.sublabel}
                        </div>
                      )}

                      {opt.description && (
                        <p className="text-xs text-[#8E9BAE] mt-1 line-clamp-2 leading-relaxed">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicador de Seleção à direita */}
                  <div className="shrink-0 flex items-center justify-center">
                    {isSelected ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFC20E] text-[#060D1B] flex items-center justify-center shadow-md animate-in zoom-in-75">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-[#1E335C] group-hover:border-[#FFC20E]/50 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 text-[#8E9BAE] group-hover:text-[#FFC20E] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. RODAPÉ DA TELA CHEIA (Ação de cancelar / confirmar) */}
      <div className="relative z-10 px-5 sm:px-8 py-3 sm:py-4 border-t border-[#16264A]/70 bg-[#060D1B]/95 backdrop-blur-md flex items-center justify-between shrink-0">
        <span className="text-[11px] sm:text-xs text-[#8E9BAE] hidden min-[480px]:inline font-mono">
          {filteredOptions.length} {filteredOptions.length === 1 ? 'opção disponível' : 'opções disponíveis'}
        </span>

        <div className="flex items-center gap-3 w-full min-[480px]:w-auto justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-[480px]:w-auto px-5 py-2.5 rounded-[8px] bg-[#11203D] hover:bg-[#16264A] text-xs font-semibold text-white/90 hover:text-white border border-[#1E335C] hover:border-[#FFC20E]/40 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

interface FullscreenSelectTriggerProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export const FullscreenSelectTrigger: React.FC<FullscreenSelectTriggerProps> = ({
  label,
  value,
  placeholder = 'Selecione uma opção...',
  onClick,
  icon,
  badge,
  className = '',
  theme = 'light',
}) => {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[8px] px-3.5 py-3 transition-all cursor-pointer flex items-center justify-between gap-3 group focus:outline-none ${
        isLight
          ? 'bg-white hover:bg-[#F9FAFB] border border-[#DDE1E8] hover:border-[#0A1428] text-[#0A1428] shadow-sm'
          : 'bg-[#0E1A33]/80 hover:bg-[#11203D] border border-[#1E335C] hover:border-[#FFC20E]/60 text-white backdrop-blur-md'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {icon && (
          <div
            className={`shrink-0 ${
              isLight ? 'text-[#0A1428]' : 'text-[#FFC20E]'
            }`}
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {value ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm truncate">
                {label}
              </span>
              {badge && (
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isLight
                      ? 'bg-[#F3F4F6] text-[#3D4757] border border-[#DDE1E8]'
                      : 'bg-[#FFC20E]/15 text-[#FFC20E] border border-[#FFC20E]/30'
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
          ) : (
            <span
              className={`text-xs ${
                isLight ? 'text-[#8E9BAE]' : 'text-[#8E9BAE]'
              }`}
            >
              {placeholder}
            </span>
          )}
        </div>
      </div>

      <div
        className={`flex items-center gap-1.5 shrink-0 text-[11px] font-semibold uppercase tracking-wider ${
          isLight
            ? 'text-[#0A1428] group-hover:text-[#FFC20E]'
            : 'text-[#8E9BAE] group-hover:text-[#FFC20E]'
        }`}
      >
        <span className="hidden sm:inline">Selecionar</span>
        <ChevronsUpDown className="w-4 h-4 transition-transform group-hover:scale-110" />
      </div>
    </button>
  );
};
