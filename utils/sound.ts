import { SoundType } from "../types";

const getAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return null;
  return new AudioContext();
};

export const playSound = async (type: SoundType, customData?: string) => {
  if (type === 'custom' && customData) {
    try {
      const audio = new Audio(customData);
      audio.play().catch(e => console.error("Error playing custom sound:", e));
      return;
    } catch (e) {
      console.error("Invalid audio data", e);
      // Fallback to classic if custom fails
      type = 'classic';
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (type) {
    case 'bell':
      // Gentle Bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      osc.start(now);
      osc.stop(now + 2.5);
      break;

    case 'digital':
      // Arcade style chime
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
         const dOsc = ctx.createOscillator();
         const dGain = ctx.createGain();
         dOsc.connect(dGain);
         dGain.connect(ctx.destination);
         
         dOsc.type = 'square';
         dOsc.frequency.value = freq;
         
         const start = now + (i * 0.1);
         dGain.gain.setValueAtTime(0.1, start);
         dGain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
         
         dOsc.start(start);
         dOsc.stop(start + 0.3);
      });
      break;

    case 'buzzer':
      // Low buzz
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      
      bOsc.type = 'sawtooth';
      bOsc.frequency.value = 150;
      
      bGain.gain.setValueAtTime(0.3, now);
      bGain.gain.linearRampToValueAtTime(0.3, now + 0.8);
      bGain.gain.linearRampToValueAtTime(0, now + 1.0);
      
      bOsc.start(now);
      bOsc.stop(now + 1.0);
      break;

    case 'classic':
    default:
      // Urgent beeping pattern
      for (let i = 0; i < 6; i++) {
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        
        cOsc.connect(cGain);
        cGain.connect(ctx.destination);
        
        cOsc.type = 'square';
        cOsc.frequency.value = 800 + (i % 2 === 0 ? 0 : 200); 
        
        const startTime = now + (i * 0.2);
        const duration = 0.1;
        
        cGain.gain.setValueAtTime(0.3, startTime);
        cGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        cOsc.start(startTime);
        cOsc.stop(startTime + duration);
      }
      break;
  }
};

export const playDingSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  osc.start();
  osc.stop(ctx.currentTime + 0.5);
};