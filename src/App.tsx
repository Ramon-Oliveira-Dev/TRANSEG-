import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationHistoryProvider } from './context/NavigationHistoryContext';
import { useBackHandler } from './hooks/useBackHandler';
import { Header } from './components/common/Header';
import { SplashScreen } from './components/common/SplashScreen';
import { AuthModal } from './components/auth/AuthModal';
import { ClientDashboard } from './components/client/ClientDashboard';
import { ProfessionalDashboard } from './components/professional/ProfessionalDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SupabaseModal } from './components/common/SupabaseModal';
import { NativeBackToast } from './components/common/NativeBackToast';

function MainAppContent() {
  const { currentUser, currentRole, isSupabaseModalOpen, setIsSupabaseModalOpen, isBookingModalOpen } = useApp();

  // Splash screen state: Always executes when the app is opened, then routes directly to client dashboard
  const [showSplash, setShowSplash] = useState(true);

  // Auth modal state for registered professionals and admin (transeg.app@gmail.com)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'admin-login'>('login');

  const handleFinishSplash = () => {
    setShowSplash(false);
  };

  const handleOpenLogin = (mode: 'login' | 'admin-login' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Botão nativo de voltar do dispositivo fecha o modal de autenticação
  useBackHandler({
    id: 'app-auth-modal',
    active: isAuthModalOpen,
    onBack: () => setIsAuthModalOpen(false)
  });

  // Botão nativo de voltar do dispositivo fecha o modal de diagnóstico do Supabase
  useBackHandler({
    id: 'app-supabase-modal',
    active: isSupabaseModalOpen,
    onBack: () => setIsSupabaseModalOpen(false)
  });

  return (
    <>
      {/* 1. Splash Screen with Logo and Company Name, routing directly to the app */}
      {showSplash && (
        <SplashScreen 
          onFinish={handleFinishSplash}
          onOpenLogin={() => {
            handleFinishSplash();
            handleOpenLogin('login');
          }}
        />
      )}

      {/* 2. Main Application Flow: Clients have direct access without credentials */}
      <div 
        className={`${
          isBookingModalOpen 
            ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' 
            : 'min-h-screen'
        } flex flex-col bg-[#050D1E] text-[#C3CBDA] font-brand-body selection:bg-[#FFC20E] selection:text-[#050D1E]`}
        style={{
          backgroundImage: 'radial-gradient(rgba(56, 120, 220, 0.22) 1.2px, transparent 1.2px)',
          backgroundSize: '26px 26px',
        }}
      >
        {/* Top Application Header with Hamburger Menu and Brand Palette - Sempre visível e preservado */}
        <div className="shrink-0 h-[72px] sm:h-[80px]">
          <Header 
            onOpenLoginModal={handleOpenLogin}
            onReplaySplash={() => setShowSplash(true)}
          />
        </div>

        {/* Dynamic view based on role: 
            - If no credentials or role === 'cliente': Client dashboard is directly available 
            - If role === 'profissional': Professional dashboard
            - If role === 'admin': Admin CCO dashboard
        */}
        <main className={isBookingModalOpen ? "flex-1 w-full min-h-0 overflow-hidden flex flex-col justify-start" : "flex-1 w-full pb-12"}>
          {(!currentUser || currentRole === 'cliente') && (
            <ClientDashboard />
          )}

          {currentUser && currentRole === 'profissional' && (
            <ProfessionalDashboard />
          )}

          {currentUser && currentRole === 'admin' && (
            <AdminDashboard />
          )}
        </main>

        {/* Rodapé Oficial Otimizado TRANSEG - Oculto durante o agendamento para eliminar scroll vertical */}
        {!isBookingModalOpen && (
          <footer className="border-t border-[#16264A]/40 bg-[#060D1B]/70 py-4 px-2 sm:px-6 text-center text-[#8E9BAE] overflow-hidden">
            <p className="text-[9.5px] min-[360px]:text-[10px] min-[390px]:text-[11px] sm:text-xs font-normal tracking-tight sm:tracking-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-full mx-auto select-none">
              © 2026 TRANSEG — Tecnologias de Segurança Ltda. Todos os direitos reservados.
            </p>
          </footer>
        )}
      </div>

      {/* 3. Restricted Login Modal (For Admin & Professional) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* 4. Supabase Connection & Diagnostics Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* 5. Alerta tático de saída ao pressionar Voltar na tela inicial */}
      <NativeBackToast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationHistoryProvider>
        <MainAppContent />
      </NavigationHistoryProvider>
    </AppProvider>
  );
}

