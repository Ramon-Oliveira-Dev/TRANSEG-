// Web Audio API emergency alert sound generator
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playPanicAlarmSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play a distinct high-urgency alternating two-tone alarm burst
    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.35;
      
      // Tone 1: 960 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(960, startTime);
      gain1.gain.setValueAtTime(0.2, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(startTime);
      osc1.stop(startTime + 0.15);

      // Tone 2: 1200 Hz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1200, startTime + 0.16);
      gain2.gain.setValueAtTime(0.25, startTime + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(startTime + 0.16);
      osc2.stop(startTime + 0.32);
    }
  } catch (err) {
    console.warn('Audio playback error (can occur if user has not interacted with page):', err);
  }
}
