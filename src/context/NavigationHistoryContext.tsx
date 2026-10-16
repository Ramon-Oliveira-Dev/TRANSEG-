import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export interface BackHandlerEntry {
  id: string;
  groupId?: string;
  onBack: () => void;
  priority?: number;
}

interface NavigationHistoryContextType {
  registerBackHandler: (entry: BackHandlerEntry) => () => void;
  triggerBack: () => void;
  dismissGroup: (groupId: string) => void;
  toastMessage: string | null;
  clearToast: () => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

export const NavigationHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stackRef = useRef<BackHandlerEntry[]>([]);
  const suppressPopstateCountRef = useRef<number>(0);
  const isHandlingPopstateRef = useRef<boolean>(false);
  const lastRootBackPressRef = useRef<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const handleRootBack = useCallback(() => {
    const now = Date.now();
    const timeSinceLast = now - lastRootBackPressRef.current;

    if (timeSinceLast < 2000 && lastRootBackPressRef.current > 0) {
      // O usuário pressionou voltar 2 vezes seguidas na tela inicial: permite sair
      setToastMessage(null);
      lastRootBackPressRef.current = 0;
      window.history.back();
    } else {
      lastRootBackPressRef.current = now;
      setToastMessage('Pressione Voltar novamente para sair do aplicativo');

      // Restaura o estado de guarda para que a página não feche no primeiro toque acidental
      try {
        window.history.pushState({ transeg_app: true, transeg_guard: true }, '');
      } catch (err) {
        console.warn('Erro ao restaurar guard state:', err);
      }

      setTimeout(() => {
        setToastMessage((prev) => {
          if (Date.now() - lastRootBackPressRef.current >= 2000) {
            return null;
          }
          return prev;
        });
      }, 2200);
    }
  }, []);

  // Inicializa o histórico na montagem do app
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.transeg_app) {
        window.history.replaceState({ transeg_app: true, transeg_root: true, depth: 0 }, '');
      }
      // Estado de guarda inicial para capturar o voltar na tela inicial
      window.history.pushState({ transeg_app: true, transeg_guard: true, depth: 1 }, '');
    } catch (e) {
      console.warn('History API não suportada ou restrita:', e);
    }

    const handlePopState = () => {
      // Se este popstate foi gerado por um recuo programático (ex: dismiss de modal fechado por clique no X)
      if (suppressPopstateCountRef.current > 0) {
        suppressPopstateCountRef.current -= 1;
        return;
      }

      // Se há manipuladores de volta na pilha
      if (stackRef.current.length > 0) {
        const top = stackRef.current.pop();
        if (top) {
          isHandlingPopstateRef.current = true;
          try {
            top.onBack();
          } catch (err) {
            console.error('Erro ao executar onBack do manipulador:', top.id, err);
          } finally {
            isHandlingPopstateRef.current = false;
          }
        }
      } else {
        // Chegou à tela raiz (início sem overlays ou modais)
        handleRootBack();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleRootBack]);

  // Registra um manipulador de tela anterior e empurra um estado no histórico do navegador
  const registerBackHandler = useCallback((entry: BackHandlerEntry) => {
    // Evita duplicatas com o mesmo ID
    const existingIdx = stackRef.current.findIndex(e => e.id === entry.id);
    if (existingIdx !== -1) {
      stackRef.current[existingIdx] = entry;
      return () => {
        const idx = stackRef.current.findIndex(e => e.id === entry.id);
        if (idx !== -1) stackRef.current.splice(idx, 1);
      };
    }

    // Empurra um estado no navegador para que o botão nativo do dispositivo tenha onde voltar
    try {
      window.history.pushState(
        { transeg_app: true, transeg_id: entry.id, depth: stackRef.current.length + 2 },
        ''
      );
    } catch (err) {
      console.warn('Erro ao registrar histórico de navegação:', err);
    }

    stackRef.current.push(entry);

    // Retorna função de desregistro para quando o componente desmontar ou fechar
    return () => {
      // Se a desmontagem foi consequência do próprio popstate, o navegador já recuou
      if (isHandlingPopstateRef.current) {
        const idx = stackRef.current.findIndex(e => e.id === entry.id);
        if (idx !== -1) {
          stackRef.current.splice(idx, 1);
        }
        return;
      }

      // Se foi fechado pelo usuário via clique em botão X/cancelar (fora do popstate)
      const idx = stackRef.current.findIndex(e => e.id === entry.id);
      if (idx !== -1) {
        stackRef.current.splice(idx, 1);
        // Recua o histórico para não deixar estados órfãos
        suppressPopstateCountRef.current += 1;
        try {
          window.history.back();
        } catch {
          suppressPopstateCountRef.current = Math.max(0, suppressPopstateCountRef.current - 1);
        }
      }
    };
  }, []);

  // Executa uma volta consciente da pilha de navegação
  const triggerBack = useCallback(() => {
    if (stackRef.current.length > 0) {
      try {
        window.history.back();
      } catch {
        // Fallback caso history.back falhe
        const top = stackRef.current.pop();
        if (top) top.onBack();
      }
    } else {
      handleRootBack();
    }
  }, [handleRootBack]);

  // Descarta todos os manipuladores pertencentes a um determinado grupo (ex: fluxo de agendamento concluído)
  const dismissGroup = useCallback((groupId: string) => {
    const itemsToRemove = stackRef.current.filter(e => e.groupId === groupId);
    const count = itemsToRemove.length;
    if (count === 0) return;

    stackRef.current = stackRef.current.filter(e => e.groupId !== groupId);

    if (!isHandlingPopstateRef.current) {
      suppressPopstateCountRef.current += count;
      try {
        window.history.go(-count);
      } catch {
        suppressPopstateCountRef.current = Math.max(0, suppressPopstateCountRef.current - count);
      }
    }
  }, []);

  return (
    <NavigationHistoryContext.Provider
      value={{
        registerBackHandler,
        triggerBack,
        dismissGroup,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory deve ser usado dentro de um NavigationHistoryProvider');
  }
  return context;
};
