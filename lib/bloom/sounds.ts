'use client';

/**
 * Plays a short, organic "pop/chime" sound via the Web Audio API.
 * 
 * Safely fails if AudioContext isn't available or if the user has requested
 * reduced motion/audio. Does not require external sound files.
 */
export function playBloomChime() {
  if (typeof window === 'undefined') return;
  
  // Respect user preference for reduced motion/distractions
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    // Create context (reuse if possible, but recreating for short pings is usually fine unless tightly spammed)
    const ctx = new AudioContext();
    
    // Master volume
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.15; // Keep it subtle
    masterGain.connect(ctx.destination);
    
    // 1. Fundamental chime (sine wave)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    
    // Slightly detuned perfect fifth or major third chord works well for organic sounds
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    // Slide up slightly for a "pop" feel
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    
    // Envelope for the fundamental
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.02); // quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); // quick decay
    
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    // Play sound
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35); // stop shortly after it fades
    
    // Cleanup context after it's done to prevent memory leak
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(console.error);
      }
    }, 500);
    
  } catch (err) {
    console.error("Failed to play bloom chime AudioContext:", err);
  }
}
