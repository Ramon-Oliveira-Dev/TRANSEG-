import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  User, 
  LogOut, 
  Radio, 
  Lock, 
  Database, 
  X, 
  AlertTriangle, 
  Compass, 
  KeyRound, 
  PlusCircle, 
  Clock, 
  History, 
  Info,
  CheckCircle2,
  ChevronRight,
  Flame,
  Siren,
  Phone,
  MessageCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../../context/AppContext';
import { playPanicAlarmSound } from '../../utils/sound';
import { useBackHandler } from '../../hooks/useBackHandler';

interface HeaderProps {
  onOpenLoginModal?: (initialMode?: 'login' | 'admin-login') => void;
  onOpenHelpModal?: () => void;
  onOpenContactModal?: () => void;
  onReplaySplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenLoginModal,
  onOpenHelpModal,
  onOpenContactModal,
  onReplaySplash
}) => {
  const { 
    currentUser, 
    currentRole, 
    logoutUser, 
    activePanicAlerts,
    supabaseStatus,
    setIsSupabaseModalOpen,
    clientTab,
    setClientTab,
    setSelectedRequestId,
    triggerPanicAlert,
    createServiceRequest,
    myRequests,
    clientSession,
    setClientSession
  } = useApp();

  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const [showQuickPanicConfirm, setShowQuickPanicConfirm] = useState(false);

  // Botão nativo de voltar do dispositivo fecha o menu hambúrguer tático
  useBackHandler({
    id: 'header-fullscreen-menu',
    active: showFullscreenMenu,
    onBack: () => setShowFullscreenMenu(false)
  });

  // Botão nativo de voltar fecha o modal de confirmação do botão de pânico
  useBackHandler({
    id: 'header-quick-panic-modal',
    active: showQuickPanicConfirm,
    onBack: () => setShowQuickPanicConfirm(false)
  });

  // Estados de Nome e Telefone para validação do chamado no Botão de Pânico
  const [panicClientName, setPanicClientName] = useState('');
  const [panicClientPhone, setPanicClientPhone] = useState('');
  const [panicError, setPanicError] = useState<string | null>(null);

  useEffect(() => {
    if (showQuickPanicConfirm) {
      setPanicClientName(clientSession?.name || currentUser?.name || '');
      setPanicClientPhone(clientSession?.phone || currentUser?.phone || '');
      setPanicError(null);
    }
  }, [showQuickPanicConfirm, clientSession, currentUser]);

  // Lock body scroll when fullscreen menu is open
  useEffect(() => {
    if (showFullscreenMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFullscreenMenu]);

  // Handle ESC key to close fullscreen menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreenMenu) {
        setShowFullscreenMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenMenu]);

  const isClientDirect = !currentUser || currentUser.role === 'cliente';

  const navigateTo = (action: () => void) => {
    setShowFullscreenMenu(false);
    setTimeout(() => {
      action();
    }, 120);
  };

  const handleGoHome = () => {
    navigateTo(() => {
      setSelectedRequestId(null);
      setClientTab('inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleGoNewRequest = () => {
    navigateTo(() => {
      setSelectedRequestId(null);
      setClientTab('nova_solicitacao');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleTriggerSOSFromMenu = () => {
    setShowFullscreenMenu(false);
    const activeReq = myRequests.find(r => 
      r.status === 'Pendente' || 
      r.status === 'Atribuído' || 
      r.status === 'A caminho' || 
      r.status === 'Em andamento'
    );
    if (activeReq && activeReq.panicTriggered) {
      // Se chamado já estiver com pânico ativo, abre diretamente a tela do pânico
      setSelectedRequestId(activeReq.id);
      setClientTab('inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowQuickPanicConfirm(true);
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#FFC20E]/15 border border-[#FFC20E]/40 text-[#FFC20E] text-xs font-brand-title font-bold tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            CENTRAL CCO (ADMIN)
          </span>
        );
      case 'profissional':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-brand-title font-bold tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            PROFISSIONAL
          </span>
        );
      case 'cliente':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-brand-title font-bold tracking-wider">
            <User className="w-3.5 h-3.5" />
            CLIENTE (ACESSO LIVRE)
          </span>
        );
    }
  };

  return (
    <>
      {/* =========================================================================
          NAVBAR PRINCIPAL EM CÁPSULA COM EFEITO GLASSMORPHISM TRANSLÚCIDO
          (EXATAMENTE COMO NA IMAGEM Screenshot_20261013-091939.png)
          - Cápsula arredondada com desfoque de vidro (glassmorphism) e borda sutil
          - Logo da TRANSEG à esquerda (3 barras amarelas ouro + TRANSEG em Chakra Petch itálico + TECNOLOGIAS DE SEGURANÇA)
          - Botão circular azul translúcido à direita com as 3 linhas brancas do menu
         ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-3 sm:pt-4 pb-2 transition-all">
        <div className="max-w-4xl mx-auto rounded-full bg-[#06142a]/65 sm:bg-[#071836]/60 backdrop-blur-xl backdrop-saturate-150 border border-[#203a67]/50 hover:border-[#2d5292]/60 px-3.5 py-2 sm:px-5 sm:py-2.5 min-h-[56px] sm:min-h-[60px] flex items-center justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.14)] transition-all">
          {/* Logo Oficial da Marca TRANSEG */}
          <div 
            onClick={handleGoHome}
            className="flex items-center cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all py-0.5"
            title="TRANSEG Tecnologias de Segurança - Ir para Início"
          >
            <Logo size="header" />
          </div>

          {/* Controles do lado direito da Navbar */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* BOTÃO CIRCULAR HAMBÚRGUER COM EFEITO GLASS (EXATAMENTE COMO NA IMAGEM Screenshot_20261013-091939.png) */}
            <button
              type="button"
              onClick={() => setShowFullscreenMenu(true)}
              aria-expanded={showFullscreenMenu}
              aria-controls="fullscreen-navigation-menu"
              aria-label="Abrir menu de navegação em tela cheia"
              title="Menu principal TRANSEG"
              className="group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0b2148]/75 hover:bg-[#123168]/85 active:scale-95 backdrop-blur-md border border-[#234882]/60 hover:border-[#3867b3]/75 shadow-[0_4px_14px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.18)] transition-all duration-200 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FFC20E]/50"
            >
              {/* 3 Barras Horizontais Brancas com espaçamento uniforme */}
              <div className="flex flex-col justify-center items-center gap-[3.5px] w-[18px] sm:w-[20px] select-none pointer-events-none">
                <span className="block h-[2px] w-full bg-white rounded-full transition-transform duration-200 group-hover:scale-x-95" />
                <span className="block h-[2px] w-full bg-white rounded-full transition-transform duration-200" />
                <span className="block h-[2px] w-full bg-white rounded-full transition-transform duration-200 group-hover:scale-x-95" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MENU HAMBÚRGUER EM TELA CHEIA (EXATAMENTE COMO NA IMAGEM Screenshot_20261012-104528.png)
          - Fundo preto fosco #0A1428 / #060D1B
          - Topo com Logo TRANSEG à esquerda
          - Botão circular de fechar com 'X' branco/cinza à direita
          - Links centrais em fonte tipográfica imponente, caixa alta (Saira / Bebas style):
              • INÍCIO
              • SOBRE NÓS
              • SERVIÇOS (com pills / badges táteis)
              • CONTATO
              • MEUS PEDIDOS
              • BOTÃO DE PÂNICO (SOS)
          - Seção de Acessos Corporativos (Central CCO, Área do Profissional, Supabase)
          - Rodapé com botões de ação direta (WhatsApp institucional e suporte)
         ========================================================================= */}
      {/* =========================================================================
          NOVO MENU HAMBÚRGUER EM TELA CHEIA (OTIMIZADO & SEM SCROLL VERTICAL)
          - Layout 100dvh sem rolagem vertical, perfeitamente organizado
          - Remoção de redundâncias (diagnósticos Supabase, emails internos, tela splash)
          - Links principais limpos com tipografia de destaque
          - Acessos corporativos compactos e simétricos (Central CCO e Profissional)
          - WhatsApp institucional direto e rodapé enxuto
         ========================================================================= */}
      {showFullscreenMenu && (
        <div 
          role="dialog"
          aria-modal="true"
          id="fullscreen-navigation-menu"
          aria-label="Menu principal de navegação em tela cheia"
          className="fixed inset-0 z-50 bg-[#060D1B] flex flex-col justify-between h-[100dvh] max-h-[100dvh] overflow-hidden select-none animate-in fade-in duration-200 selection:bg-[#FFC20E] selection:text-[#0A1428]"
        >
          {/* Malha de fundo tática sutil */}
          <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-[#16264A]/25 via-transparent to-transparent pointer-events-none" />

          {/* 1. TOPO DA TELA CHEIA (Logo TRANSEG + Fechar) */}
          <div className="relative z-10 px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-[#16264A]/70 bg-[#060D1B]/95 backdrop-blur-md shrink-0">
            {/* Logo da Marca TRANSEG */}
            <div 
              onClick={handleGoHome}
              className="cursor-pointer hover:opacity-95 transition-opacity"
            >
              <Logo size="header" />
            </div>

            {/* Botão de Fechar Circular com 'X' */}
            <button
              type="button"
              onClick={() => setShowFullscreenMenu(false)}
              aria-label="Fechar menu de navegação"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#11203D] hover:bg-[#16264A] active:scale-95 text-white/90 hover:text-white border border-[#1E335C] hover:border-[#FFC20E]/50 flex items-center justify-center transition-all shadow-md focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 2. CORPO CENTRAL DA NAVEGAÇÃO EM TELA CHEIA (Sem scroll, direto e organizado) */}
          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-xl w-full mx-auto px-6 py-2 sm:py-3 min-h-0">
            {/* Lista Principal de Navegação */}
            <nav className="flex flex-col space-y-1 sm:space-y-1.5">
              {/* Item: INÍCIO */}
              <button
                type="button"
                onClick={handleGoHome}
                className="group flex items-center justify-between py-2 sm:py-2.5 text-left border-b border-[#16264A]/30 hover:border-[#FFC20E]/40 transition-all cursor-pointer"
              >
                <span className="font-brand-title font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-[#FFC20E] group-hover:translate-x-2 transition-all drop-shadow-[0_2px_8px_rgba(255,194,14,0.3)]">
                  Início
                </span>
                <ChevronRight className="w-5 h-5 text-[#FFC20E] group-hover:translate-x-1 transition-all" />
              </button>


              {/* Item: CONSULTAR CHAMADOS & AGENDA (Apenas com Nome e Telefone) */}
              <button
                type="button"
                onClick={() => {
                  navigateTo(() => {
                    setSelectedRequestId(null);
                    setClientTab('agenda');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  });
                }}
                className="group flex items-center justify-between py-2 sm:py-2.5 text-left border-b border-[#16264A]/30 hover:border-[#FFC20E]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-brand-title font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-white group-hover:text-[#FFC20E] group-hover:translate-x-2 transition-all">
                    Consultar Meus Chamados & Agendamento
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8E9BAE] group-hover:text-[#FFC20E] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Item: BOTÃO DE PÂNICO (SOS) - Exclusivo do Menu Hambúrguer */}
              <button
                type="button"
                onClick={handleTriggerSOSFromMenu}
                className="group flex items-center justify-between py-2 sm:py-2.5 text-left border-b border-[#DC2626]/30 hover:border-[#DC2626] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-brand-title font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-[#DC2626] group-hover:text-rose-400 group-hover:translate-x-1.5 transition-all flex items-center gap-2">
                    Botão de Pânico
                    <Flame className="w-5 h-5 animate-pulse text-[#DC2626]" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/40 font-bold tracking-wider">
                    SOS · IMEDIATO
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#DC2626]/60 group-hover:text-[#DC2626] group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </nav>

            {/* SEÇÃO CORPORATIVA SIMPLIFICADA (Acessos Restritos) */}
            <div className="mt-3.5 sm:mt-4 pt-3 border-t border-[#16264A]/60">
              {isClientDirect ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Central CCO (Admin) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullscreenMenu(false);
                      if (onOpenLoginModal) onOpenLoginModal('admin-login');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1C38] hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-left text-white transition-all group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-[4px] bg-[#FFC20E]/10 border border-[#FFC20E]/30 flex items-center justify-center text-[#FFC20E] shrink-0">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs group-hover:text-[#FFC20E] transition-colors truncate">
                          Central CCO
                        </div>
                        <div className="text-[10px] text-[#8E9BAE] truncate">
                          Admin
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E9BAE] group-hover:text-[#FFC20E] shrink-0" />
                  </button>

                  {/* Área do Profissional */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowFullscreenMenu(false);
                      if (onOpenLoginModal) onOpenLoginModal('login');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1C38] hover:bg-[#16264A] border border-[#1E335C] hover:border-cyan-400/50 text-left text-white transition-all group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-[4px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs group-hover:text-cyan-400 transition-colors truncate">
                          Profissional
                        </div>
                        <div className="text-[10px] text-[#8E9BAE] truncate">
                          Agentes
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8E9BAE] group-hover:text-cyan-400 shrink-0" />
                  </button>
                </div>
              ) : (
                /* Sessão Autenticada */
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    setShowFullscreenMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <div className="text-left">
                      <div className="font-bold text-xs">Sair da Sessão ({currentUser?.name})</div>
                      <div className="text-[10px] text-rose-300/70">Voltar ao modo cliente</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              )}
            </div>
          </div>

          {/* 3. RODAPÉ DA TELA CHEIA (Direto, sem número de telefone, sem excessos) */}
          <div className="relative z-10 border-t border-[#16264A]/70 py-3 sm:py-3.5 px-6 bg-[#060D1B] shrink-0">
            <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-1.5 text-center">
              <a
                href="https://wa.me/552733008000?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20os%20servi%C3%A7os%20da%20TRANSEG."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs sm:text-sm font-brand-title font-bold uppercase tracking-wider transition-all shadow-[0_2px_12px_rgba(16,185,129,0.15)] active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Oficial TRANSEG</span>
              </a>

              <div className="text-[11px] text-[#8E9BAE] font-medium tracking-wide">
                Central CCO Operacional 24h • Vitória - ES
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO DE PÂNICO GLOBAL (Gradiente e Glassmorphism TRANSEG)
         ========================================================================= */}
      {showQuickPanicConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D1B]/85 backdrop-blur-md animate-in fade-in">
          <div className="relative bg-gradient-to-b from-[#1F080D]/95 via-[#0F1428]/95 to-[#060D1B]/95 border border-[#DC2626]/70 rounded-[14px] max-w-md w-full p-5 sm:p-6 text-white shadow-[0_0_40px_rgba(220,38,38,0.45)] space-y-4 backdrop-blur-xl overflow-hidden font-body">
            {/* Efeitos difusos de luz de emergência */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#DC2626]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#0F1428]/80 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3 text-[#DC2626]">
              <div className="w-11 h-11 rounded-full bg-[#DC2626]/20 border border-[#DC2626] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(220,38,38,0.4)]">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="eyebrow text-[#DC2626] block text-[10px] tracking-widest font-chakra">
                  PRIORIDADE MÁXIMA · CCO 24H
                </span>
                <h3 className="font-chakra font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                  Acionamento Tático de Emergência
                </h3>
              </div>
            </div>

            <div className="relative z-10 bg-[#0A1020]/75 border border-[#1E2942] rounded-[10px] p-3 text-xs space-y-1.5 text-[#C3CBDA]">
              <p className="leading-relaxed">
                O <strong className="text-white">Botão de Pânico</strong> solicita um atendimento de <strong className="text-[#FFC20E]">pronta-resposta imediata</strong> com envio instantâneo de sinal sonoro e visual para a Central de Operações CCO.
              </p>
              <p className="text-[11px] text-[#DC2626] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-ping" />
                Despacho prioritário da viatura mais próxima em Vitória - ES
              </p>
            </div>

            {/* Campos Obrigatórios: Nome Completo e Número de Telefone para Validar o Chamado */}
            <div className="relative z-10 space-y-3 pt-1 border-t border-[#16264A]/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-chakra font-bold text-white uppercase tracking-wider block">
                  Identificação para Validação do Chamado:
                </span>
                <span className="text-[10px] font-mono text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded border border-[#DC2626]/30">
                  Obrigatório
                </span>
              </div>

              <div>
                <label className="block text-[10.5px] font-chakra font-semibold text-[#8E9BAE] uppercase tracking-wider mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={panicClientName}
                  onChange={(e) => {
                    setPanicClientName(e.target.value);
                    if (panicError) setPanicError(null);
                  }}
                  placeholder="Seu nome completo para a Central CCO"
                  className="w-full bg-[#0A1020]/90 border border-[#DC2626]/40 focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/50 rounded-[8px] px-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-body"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-chakra font-semibold text-[#8E9BAE] uppercase tracking-wider mb-1">
                  Número de Telefone / WhatsApp:
                </label>
                <input
                  type="tel"
                  value={panicClientPhone}
                  onChange={(e) => {
                    setPanicClientPhone(e.target.value);
                    if (panicError) setPanicError(null);
                  }}
                  placeholder="(27) 99999-9999"
                  className="w-full bg-[#0A1020]/90 border border-[#DC2626]/40 focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/50 rounded-[8px] px-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-body"
                />
              </div>

              {panicError && (
                <div className="p-2.5 bg-red-950/80 border border-red-500/70 rounded-[8px] text-[11px] text-red-200 font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{panicError}</span>
                </div>
              )}
            </div>

            <div className="relative z-10 flex items-center justify-end gap-2.5 pt-2 border-t border-[#16264A]/80">
              <button
                type="button"
                onClick={() => setShowQuickPanicConfirm(false)}
                className="btn-ghost-dark !py-2.5 !px-4 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!panicClientName.trim() || panicClientName.trim().length < 3) {
                    setPanicError('Preencha seu Nome Completo para validar o chamado imediato.');
                    return;
                  }
                  const digits = panicClientPhone.replace(/\D/g, '');
                  if (digits.length < 8) {
                    setPanicError('Preencha um Número de Telefone / WhatsApp válido para contato.');
                    return;
                  }

                  setShowQuickPanicConfirm(false);
                  playPanicAlarmSound();
                  
                  // Salva na sessão do cliente para validar e consultar futuros chamados
                  setClientSession({
                    name: panicClientName.trim(),
                    phone: panicClientPhone.trim()
                  });

                  const activeReq = myRequests.find(r => 
                    r.status === 'Pendente' || 
                    r.status === 'Atribuído' || 
                    r.status === 'A caminho' || 
                    r.status === 'Em andamento'
                  );

                  if (activeReq) {
                    triggerPanicAlert(activeReq.id);
                    setSelectedRequestId(activeReq.id);
                    setClientTab('inicio');
                  } else {
                    const res = createServiceRequest({
                      serviceType: 'Escolta VIP',
                      address: 'Localização de Emergência (GPS Coordenadas Ativas)',
                      isImmediate: true,
                      clientName: panicClientName.trim(),
                      clientPhone: panicClientPhone.trim(),
                      observations: 'ACIONAMENTO DE EMERGÊNCIA / PÂNICO IMEDIATO PELO USUÁRIO',
                    });
                    if (res.success && res.request) {
                      triggerPanicAlert(res.request.id);
                      setSelectedRequestId(res.request.id);
                      setClientTab('inicio');
                    }
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-yellow !bg-gradient-to-r !from-[#DC2626] !to-[#991B1B] hover:!from-[#EF4444] hover:!to-[#B91C1C] !text-white !border-[#DC2626] !py-2.5 !px-4 text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] cursor-pointer active:scale-95 transition-all font-chakra font-bold"
              >
                <Flame className="w-4 h-4 animate-pulse" />
                <span>Confirmar Atendimento Imediato (SOS)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
