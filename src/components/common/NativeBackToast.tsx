import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigationHistory } from '../../context/NavigationHistoryContext';

export const NativeBackToast: React.FC = () => {
  const { toastMessage } = useNavigationHistory();

  if (!toastMessage) return null;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none px-4 py-2.5 rounded-full bg-[#0E1A33]/95 border border-[#FFC20E]/60 shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[90vw]"
      role="status"
      aria-live="polite"
    >
      <ShieldAlert className="w-4 h-4 text-[#FFC20E] shrink-0 animate-pulse" />
      <span className="text-xs sm:text-sm font-chakra font-medium text-white tracking-wide text-center">
        {toastMessage}
      </span>
    </div>
  );
};
