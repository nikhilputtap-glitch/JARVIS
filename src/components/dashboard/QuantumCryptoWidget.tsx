import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, Terminal } from 'lucide-react';

const QuantumCryptoWidget: React.FC = () => {
  const [decrypted, setDecrypted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    let animationFrameId: number;
    let frameCount = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = decrypted ? '#34d399' : '#22d3ee'; // emerald-400 or cyan-400
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      frameCount++;
      if (frameCount > 150 && !decrypted) {
        setDecrypted(true);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [decrypted]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-4 border-b border-cyan-900/50 pb-2">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Quantum.Decryption
        </h3>
        <span className={`text-[9px] tracking-widest animate-pulse flex items-center gap-1 ${decrypted ? 'text-emerald-400' : 'text-cyan-500/60'}`}>
          {decrypted ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {decrypted ? 'DECRYPTED' : 'BRUTE FORCING...'}
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden border border-cyan-900/50 bg-black/80">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {decrypted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-emerald-400 text-xs font-mono tracking-widest mb-2">FILE: PROJECT_PEGASUS.DAT</div>
              <div className="text-emerald-300/70 text-[10px] uppercase tracking-[0.2em]">Access Granted</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
    </motion.div>
  );
};

export default QuantumCryptoWidget;
