import React, { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  onOpenLogin?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const finishedRef = useRef(false);

  const completeAndExit = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setProgress(100);
    setFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  useEffect(() => {
    const totalDuration = 6000; // 6 segundos de ciclo suave
    const startTime = performance.now();

    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);

      setProgress(currentProgress);

      if (currentProgress < 100) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        completeAndExit();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Suave efeito de inclinação 3D que acompanha o movimento do ponteiro
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { clientWidth, clientHeight } = currentTarget;
    const x = ((clientX - clientWidth / 2) / clientWidth) * 10;
    const y = ((clientY - clientHeight / 2) / clientHeight) * 10;
    setTilt({ x, y });
  };

  // Clique/toque acelera instantaneamente para a aplicação
  const handleDirectClick = () => {
    completeAndExit();
  };

  const roundedPercentage = Math.min(100, Math.floor(progress));

  return (
    <div
      onClick={handleDirectClick}
      onPointerMove={handlePointerMove}
      className={`fixed inset-0 z-[100] flex flex-col justify-between items-center bg-[#050D1E] text-white select-none overflow-hidden cursor-pointer transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse 1100px 850px at 50% 35%, rgba(13, 27, 54, 0.95) 0%, rgba(10, 20, 40, 0.98) 55%, #050D1E 100%),
          linear-gradient(180deg, #0A1428 0%, #0D1B36 50%, #050D1E 100%)
        `,
      }}
    >
      {/* 0. Malha Tática Azul Oficial do App */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage: 'radial-gradient(rgba(56, 120, 220, 0.22) 1.2px, transparent 1.2px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Brilhos atmosféricos azuis do padrão TRANSEG */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#162B55]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0D1B36]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* =========================================================================
          CAMADA DE ELEMENTOS E LINHAS TEMÁTICAS DE SEGURANÇA E TELEMETRIA
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* 1. Malha Geométrica Sutil de Monitoramento (Grid Tático Sombrio) */}
        <div 
          className="absolute inset-0 animate-grid-glow opacity-80"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 194, 14, 0.025) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(22, 44, 88, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, black 25%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, black 25%, transparent 80%)',
          }}
        />

        {/* 2. Feixe de Varredura Laser de Segurança (Cyber Scanline Vertical) */}
        <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[#FFC20E]/[0.035] to-transparent animate-scanline pointer-events-none" />

        {/* 3. Retículo Central de Radar e Ondas Concêntricas de Monitoramento */}
        <div className="absolute inset-0 flex items-center justify-center">
          
          {/* Eixo Reticular de Coordenadas Táticas (Mira central do radar) */}
          <div className="absolute w-[640px] h-[1px] bg-gradient-to-r from-transparent via-[#FFC20E]/12 to-transparent" />
          <div className="absolute h-[480px] w-[1px] bg-gradient-to-b from-transparent via-[#FFC20E]/12 to-transparent" />

          {/* Marcadores de Milirradiano nos eixos */}
          <div className="absolute w-2 h-[1px] bg-[#FFC20E]/30 translate-x-28" />
          <div className="absolute w-2 h-[1px] bg-[#FFC20E]/30 -translate-x-28" />
          <div className="absolute h-2 w-[1px] bg-[#FFC20E]/30 translate-y-24" />
          <div className="absolute h-2 w-[1px] bg-[#FFC20E]/30 -translate-y-24" />

          {/* Anéis de Radar Concêntricos com Opacidades Equilibradas */}
          <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[#FFC20E]/10 border-dashed" />
          <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full border border-[#1E3A70]/20 animate-radar-1" />
          <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full border border-[#FFC20E]/[0.07] animate-radar-2" />
          <div className="absolute w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] rounded-full border border-[#0F1E3D]/25" />

          {/* Feixe Giratório de Varredura Radar HUD */}
          <div className="absolute w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full overflow-hidden animate-radar-sweep pointer-events-none opacity-30">
            <div 
              className="w-1/2 h-1/2 origin-bottom-right"
              style={{
                background: 'conic-gradient(from 0deg, rgba(255, 194, 14, 0.18) 0deg, rgba(255, 194, 14, 0.03) 45deg, transparent 90deg)',
              }}
            />
          </div>

          {/* Brilho Dourado Âmbar Focado Central */}
          <div className="w-[380px] h-[380px] rounded-full bg-[#FFC20E]/[0.045] blur-3xl animate-pulse" />

          {/* Nó de Satélite Superior Conectado */}
          <div className="absolute -top-14 right-1/4 sm:right-1/3 flex items-center gap-2 opacity-80">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC20E] shadow-[0_0_8px_#FFC20E] animate-node-beacon" />
            <div className="h-[1px] w-8 bg-gradient-to-r from-[#FFC20E]/25 to-transparent" />
          </div>

          {/* Micro-partículas em suspensão sutil */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#FFC20E]/25 blur-xs top-1/4 left-1/3 animate-particle-1" />
          <div className="absolute w-2 h-2 rounded-full bg-[#FFE382]/20 blur-xs bottom-1/3 right-1/4 animate-particle-2" />
          <div className="absolute w-1 h-1 rounded-full bg-[#FFC20E]/25 blur-xs top-2/3 left-1/5 animate-particle-3" />
        </div>

        {/* 4. Cantoneiras Táticas de Precisão HUD (Mira nos 4 cantos da tela) */}
        {/* Superior Esquerdo */}
        <div className="absolute top-5 left-5 sm:top-8 sm:left-8 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-start">
            <div className="w-6 sm:w-8 h-[2px] bg-[#FFC20E]/50 shadow-[0_0_8px_rgba(255,194,14,0.3)]" />
            <div className="w-[2px] h-6 sm:h-8 -ml-[2px] bg-[#FFC20E]/50 shadow-[0_0_8px_rgba(255,194,14,0.3)]" />
          </div>
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] text-[#FFC20E]/40 uppercase mt-0.5 ml-1">
            SYS // 24.7
          </span>
        </div>

        {/* Superior Direito */}
        <div className="absolute top-5 right-5 sm:top-8 sm:right-8 flex flex-col items-end gap-1 pointer-events-none">
          <div className="flex items-start">
            <div className="w-[2px] h-6 sm:h-8 -mr-[2px] bg-[#FFC20E]/50 shadow-[0_0_8px_rgba(255,194,14,0.3)]" />
            <div className="w-6 sm:w-8 h-[2px] bg-[#FFC20E]/50 shadow-[0_0_8px_rgba(255,194,14,0.3)]" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] text-[#7E92B6] uppercase">
              GPS // ONLINE
            </span>
          </div>
        </div>

        {/* Inferior Esquerdo */}
        <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 flex items-end pointer-events-none">
          <div className="w-6 sm:w-8 h-[2px] bg-[#FFC20E]/30" />
          <div className="w-[2px] h-6 sm:h-8 -ml-[2px] bg-[#FFC20E]/30" />
        </div>

        {/* Inferior Direito */}
        <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex items-end pointer-events-none">
          <div className="w-[2px] h-6 sm:h-8 -mr-[2px] bg-[#FFC20E]/30" />
          <div className="w-6 sm:w-8 h-[2px] bg-[#FFC20E]/30" />
        </div>

        {/* 5. Linhas Horizontais Tecnológicas com Degrau Angular */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-15 sm:opacity-20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Linha Tecnológica Superior */}
          <path 
            d="M 0,90 L 160,90 L 190,120 L 400,120" 
            fill="none" 
            stroke="url(#lineGradGold)" 
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Linha Tecnológica Inferior Invertida */}
          <path 
            d="M 1200,820 L 980,820 L 950,790 L 750,790" 
            fill="none" 
            stroke="url(#lineGradGold)" 
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="lineGradGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFC20E" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFC20E" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

      </div>

      {/* Espaçador superior invisível para balancear a proporção vertical */}
      <div className="w-full h-8 sm:h-12 pointer-events-none" />

      {/* =========================================================================
          ÁREA CENTRAL HERO: Logo Oficial Transeg com Movimento Dinâmico Aprimorado
          ========================================================================= */}
      <div
        className="relative z-10 flex items-center justify-center my-auto px-4 transition-transform duration-200 ease-out will-change-transform animate-logo-float"
        style={{
          transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
        }}
      >
        {/* Brilho Difuso Suave atrás de toda a Logo */}
        <div className="absolute -inset-12 sm:-inset-16 rounded-full bg-gradient-to-r from-[#FFC20E]/15 via-[#FFC20E]/08 to-transparent blur-3xl pointer-events-none" />

        {/* Lockup Oficial da Logo: Ícone das 3 Barras à Esquerda + Tipografia à Direita */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 md:gap-9">
          
          {/* O ÍCONE: Três Barras Inclinadas com Movimento Fluido e Feixe de Luz Reluzente */}
          <div className="relative group">
            {/* Halo de luz neon dourada focado sob o ícone */}
            <div className="absolute -inset-4 sm:-inset-6 rounded-2xl bg-[#FFC20E]/20 blur-xl group-hover:bg-[#FFC20E]/35 transition-all duration-300 pointer-events-none" />

            {/* Container das 3 Barras com reflexo dinâmico */}
            <div className="relative inline-flex items-center h-16 sm:h-20 md:h-24 gap-3 sm:gap-3.5 md:gap-4 select-none overflow-visible">
              
              {/* Barra 1: Paralelogramo Amarelo Ouro com elevação harmônica */}
              <div
                className="relative h-full w-3.5 sm:w-4.5 md:w-5 bg-gradient-to-b from-[#FFF2B2] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_16px_rgba(255,194,14,0.6)] animate-bar-1 origin-bottom overflow-hidden"
              >
                {/* Feixe de brilho especular dinâmico */}
                <div className="absolute inset-0 w-full bg-gradient-to-t from-transparent via-white/70 to-transparent animate-icon-sheen pointer-events-none" />
              </div>

              {/* Barra 2: Paralelogramo Amarelo Ouro central com elevação e brilho acentuado */}
              <div
                className="relative h-full w-3.5 sm:w-4.5 md:w-5 bg-gradient-to-b from-[#FFF2B2] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_20px_rgba(255,194,14,0.75)] animate-bar-2 origin-bottom overflow-hidden"
              >
                {/* Feixe de brilho especular dinâmico com ligeiro offset */}
                <div 
                  className="absolute inset-0 w-full bg-gradient-to-t from-transparent via-white/80 to-transparent animate-icon-sheen pointer-events-none"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>

              {/* Barra 3: Paralelogramo Amarelo Ouro com elevação harmônica */}
              <div
                className="relative h-full w-3.5 sm:w-4.5 md:w-5 bg-gradient-to-b from-[#FFF2B2] via-[#FFC20E] to-[#E5A800] brand-skew-bar rounded-[2px] shadow-[0_0_16px_rgba(255,194,14,0.6)] animate-bar-3 origin-bottom overflow-hidden"
              >
                {/* Feixe de brilho especular dinâmico */}
                <div 
                  className="absolute inset-0 w-full bg-gradient-to-t from-transparent via-white/70 to-transparent animate-icon-sheen pointer-events-none"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </div>

          {/* O BLOCO TIPOGRÁFICO: TRANSEG + TECNOLOGIAS DE SEGURANÇA (Padrão Oficial da Imagem) */}
          <div className="flex flex-col items-center sm:items-start justify-center leading-none text-center sm:text-left select-none">
            {/* TRANSEG: Bold, Italic, Caixa Alta, Branco Puro com Chakra Petch */}
            <h1 
              className="font-chakra font-black italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.05em] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: "'Chakra Petch', 'Saira', sans-serif" }}
            >
              TRANSEG
            </h1>

            {/* Subtítulo Oficial: TECNOLOGIAS DE SEGURANÇA */}
            <p 
              className="font-chakra font-semibold uppercase text-[11px] sm:text-xs md:text-sm lg:text-base tracking-[0.36em] sm:tracking-[0.42em] md:tracking-[0.48em] text-white mt-2 sm:mt-2.5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "'Chakra Petch', 'Saira', sans-serif" }}
            >
              TECNOLOGIAS DE SEGURANÇA
            </p>
          </div>

        </div>
      </div>

      {/* =========================================================================
          DOCK INFERIOR: Barra de Carregamento Interativa na Base com Percentual
          ========================================================================= */}
      <div 
        className="relative z-10 w-full max-w-sm sm:max-w-md px-6 pb-9 sm:pb-11"
        onPointerEnter={() => setIsInteracting(true)}
        onPointerLeave={() => setIsInteracting(false)}
      >
        {/* Cabeçalho da Barra: Status + Percentual Dinâmico */}
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC20E] shadow-[0_0_8px_#FFC20E] animate-ping" />
            <span className="font-brand-title text-[11px] font-bold tracking-[0.2em] text-[#8FA3C2] uppercase">
              SISTEMA DE SEGURANÇA ATIVO
            </span>
          </div>
          
          {/* Contador Percentual em Tempo Real */}
          <div className="flex items-baseline gap-0.5 font-brand-title">
            <span className="text-base sm:text-lg font-black text-[#FFC20E] drop-shadow-[0_0_12px_rgba(255,194,14,0.8)] tracking-wider">
              {roundedPercentage}
            </span>
            <span className="text-xs font-bold text-[#FFC20E]/80">
              %
            </span>
          </div>
        </div>

        {/* Trilha Interativa com Efeito Hover e Borda Dourada Reativa */}
        <div 
          className={`relative p-0.5 rounded-full bg-[#040915]/95 border transition-all duration-300 animate-track-glow shadow-[0_4px_24px_rgba(0,0,0,0.7)] ${
            isInteracting 
              ? 'border-[#FFC20E]/70 shadow-[0_0_24px_rgba(255,194,14,0.3)] scale-[1.02]' 
              : 'border-[#132244]/90 hover:border-[#FFC20E]/50'
          }`}
        >
          {/* Trilha Interna */}
          <div className="relative h-2 sm:h-2.5 w-full bg-[#02050D] rounded-full overflow-hidden">
            {/* Brilho Difuso do Preenchimento */}
            <div 
              className="absolute inset-y-0 left-0 bg-[#FFC20E]/20 blur-sm transition-all duration-75"
              style={{ width: `${progress}%` }}
            />

            {/* Barra Preenchida em Gradiente Ouro Oficial */}
            <div
              className="relative h-full bg-gradient-to-r from-[#D49D00] via-[#FFC20E] to-[#FFF3B8] transition-all duration-75 ease-linear rounded-full shadow-[0_0_14px_rgba(255,194,14,0.8)]"
              style={{ width: `${progress}%` }}
            >
              {/* Feixe Contínuo de Luz Varrendo o Progresso */}
              <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-bar-shimmer" />
            </div>

            {/* Cometa Guia Iluminado no Topo do Progresso */}
            {progress > 1 && progress < 99 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_#FFC20E,0_0_20px_#FFC20E] animate-comet-pulse pointer-events-none"
                style={{ left: `${progress}%` }}
              />
            )}
          </div>
        </div>

        {/* Linha de telemetria auxiliar inferior + Dica de Aceleração */}
        <div className="flex items-center justify-between text-[10px] text-[#4F6488] mt-2 font-mono px-1">
          <span>MONITORAMENTO 24H</span>
          <span className="text-[#64748B]/70 tracking-wide">Toque para entrar</span>
          <span>PROTEÇÃO ATIVA</span>
        </div>
      </div>
    </div>
  );
};
