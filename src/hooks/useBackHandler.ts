import { useEffect, useRef } from 'react';
import { useNavigationHistory } from '../context/NavigationHistoryContext';

export interface UseBackHandlerOptions {
  id: string;
  groupId?: string;
  active: boolean;
  onBack: () => void;
  priority?: number;
}

/**
 * Hook para integrar qualquer tela, modal, passo de stepper, aba ou gaveta
 * ao botão nativo de voltar do dispositivo (Android/iOS/Navegador).
 */
export function useBackHandler({
  id,
  groupId,
  active,
  onBack,
  priority
}: UseBackHandlerOptions) {
  const { registerBackHandler } = useNavigationHistory();
  const onBackRef = useRef(onBack);

  // Mantém a referência da função onBack sempre atualizada sem re-executar o effect
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) return;

    const unregister = registerBackHandler({
      id,
      groupId,
      onBack: () => {
        if (onBackRef.current) {
          onBackRef.current();
        }
      },
      priority
    });

    return () => {
      unregister();
    };
  }, [active, id, groupId, registerBackHandler, priority]);
}
