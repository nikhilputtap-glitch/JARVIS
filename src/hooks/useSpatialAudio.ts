import { useEffect, useRef, useCallback } from 'react';

export const useSpatialAudio = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction to comply with browser policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, []);

  const playSpatialSound = useCallback((x: number, y: number, z: number = 0, type: 'beep' | 'hum' | 'scan' = 'beep') => {
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const panner = ctx.createPanner();

    // Panner settings for 3D spatial audio
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

    // Normalize x, y from percentage (0-100) to Web Audio coordinates (-1 to 1)
    const normX = (x / 100) * 2 - 1;
    const normY = -((y / 100) * 2 - 1); // Invert Y for audio space

    // Set position
    panner.positionX.setValueAtTime(normX * 5, ctx.currentTime);
    panner.positionY.setValueAtTime(normY * 5, ctx.currentTime);
    panner.positionZ.setValueAtTime(z, ctx.currentTime);

    // Sound profiles
    if (type === 'beep') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } else if (type === 'hum') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(110, ctx.currentTime); // A2
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } else if (type === 'scan') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    }

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(ctx.destination);
  }, []);

  return { playSpatialSound };
};
