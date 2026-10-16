import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, PhoneCall, X, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PanicControlProps {
  requestId: string;
  className?: string;
}

export const PanicControl: React.FC<PanicControlProps> = ({ requestId, className = '' }) => {
  const { triggerPanicAlert, activePanicAlerts } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Check if there is already an active panic alert for this specific request
  const activeAlertForRequest = activePanicAlerts.find(a => a.requestId === requestId);

  const handleTriggerConfirm = () => {
    const res = triggerPanicAlert(requestId);
    setShowConfirmModal(false);
    if (res.success) {
      setFeedbackMsg('Alerta enviado com prioridade máxima à central CCO!');
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const formattedTime = activeAlertForRequest 
    ? new Date(activeAlertForRequest.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`relative rounded-[14px] p-5 text-center border border-[#DC2626]/40 bg-gradient-to-b from-[#180A12]/95 via-[#0D1326]/95 to-[#060D1B]/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${className}`}>
      {/* Se alerta ativo */}
      {activeAlertForRequest ? (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#DC2626]/20 border border-[#DC2626] rounded-full text-[#DC2626] text-xs font-chakra font-bold uppercase tracking-wider animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.35)]">
            <ShieldAlert className="w-4 h-4" />
            <span>Alerta ativo desde {formattedTime} — Central CCO em alerta</span>
          </div>

          <p className="text-xs text-[#C3CBDA] leading-relaxed max-w-md mx-auto">
            Protocolo de emergência em andamento. Equipe tática e operadores da central CCO receberam suas coordenadas e estão acompanhando o chamado.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:190"
              className="btn-yellow !bg-gradient-to-r !from-[#DC2626] !to-[#991B1B] hover:!from-[#EF4444] hover:!to-[#B91C1C] !text-white text-xs !py-2.5 !px-5 inline-flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.45)] cursor-pointer active:scale-95 transition-all font-chakra font-bold rounded-[8px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ligar 190 (Polícia Militar)</span>
            </a>
          </div>

          <p className="text-[11px] text-[#DC2626] font-semibold">
            Nota de Segurança: Em situação de perigo extremo, ligue 190.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white font-chakra font-bold text-sm sm:text-base tracking-wider rounded-[10px] shadow-[0_0_25px_rgba(220,38,38,0.45)] flex items-center justify-center gap-2.5 transition-transform active:scale-95 pulse-panic-active border border-[#DC2626]/80 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-white shrink-0 animate-pulse" />
              <span>BOTÃO DE PÂNICO — ACIONAR EMERGÊNCIA</span>
            </button>
            <span className="text-[11px] text-[#8E9BAE] mt-2 block font-medium">
              Aciona atendimento de imediato com envio de alerta sonoro à Central CCO
            </span>
          </div>

          <p className="text-[11px] text-[#8E9BAE] font-medium border-t border-[#16264A]/80 pt-2.5">
            Nota de Segurança: Em perigo imediato, ligue <strong className="text-white underline">190</strong>.
          </p>
        </div>
      )}

      {feedbackMsg && (
        <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-[8px] text-xs text-emerald-300 font-medium">
          {feedbackMsg}
        </div>
      )}

      {/* Confirmation Modal (Dark Glassmorphism TRANSEG) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-[#060D1B]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-gradient-to-b from-[#1F080D]/95 via-[#0E152A]/95 to-[#060D1B]/95 border border-[#DC2626]/70 rounded-[14px] max-w-md w-full p-5 sm:p-6 shadow-[0_0_40px_rgba(220,38,38,0.45)] space-y-4 text-left animate-in fade-in duration-200 font-body overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DC2626]/20 border border-[#DC2626] flex items-center justify-center text-[#DC2626] shadow-[0_0_15px_rgba(220,38,38,0.35)] shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-chakra font-bold text-base sm:text-lg text-white uppercase tracking-wider">
                    Acionar Alerta de Emergência?
                  </h3>
                  <p className="text-[11px] text-[#DC2626] font-chakra font-bold uppercase tracking-wider">
                    Prioridade Máxima — Central CCO
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-[#11203D] hover:bg-[#16264A] text-[#C3CBDA] hover:text-white border border-[#1E335C] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#C3CBDA] leading-relaxed">
              Você está prestes a disparar o sinal sonoro e visual de emergência no Centro de Controle Operacional (CCO) da TRANSEG. 
              Nossos operadores serão acionados em tempo real com sua localização e dados do atendimento.
            </p>

            <div className="p-3 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-[10px] text-xs space-y-1">
              <p className="font-chakra font-bold text-[#DC2626] uppercase">Orientações imediatas:</p>
              <p className="text-[#C3CBDA]">• Mantenha a calma e permaneça em local seguro.</p>
              <p className="font-bold text-[#DC2626]">• Em perigo extremo imediato, ligue 190.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#16264A]/80">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-ghost-dark !py-2 !px-4 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTriggerConfirm}
                className="btn-yellow !bg-gradient-to-r !from-[#DC2626] !to-[#991B1B] hover:!from-[#EF4444] hover:!to-[#B91C1C] !text-white !border-[#DC2626] !py-2 !px-4 text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.45)] cursor-pointer active:scale-95 transition-all font-chakra font-bold"
              >
                <Flame className="w-4 h-4 animate-pulse" />
                <span>Confirmar e Disparar Alerta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
