import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Activity, Cpu } from 'lucide-react';

interface BriefingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const briefingText = [
  "INITIALIZING DAILY BRIEFING PROTOCOL...",
  "AUTHENTICATING USER: NIKHIL [VERIFIED]",
  "ACCESSING SECURE CALENDAR DATA...",
  "-> 09:00 SYSTEM DIAGNOSTICS",
  "-> 11:30 SECURE COMM LINK",
  "-> 14:00 PROJECT REVIEW",
  "ACCESSING COMM.INTERCEPT (EMAIL)...",
  "-> 3 UNREAD MESSAGES DETECTED",
  "-> 2 ENCRYPTED, 1 CLEARED",
  "ATMOSPHERIC DATA: 24.1°C, CLEAR SKIES",
  "ALL SYSTEMS NOMINAL. READY FOR COMMAND."
];

const BriefingOverlay: React.FC<BriefingOverlayProps> = ({ isOpen, onClose }) => {
  const [displayedLines, setDisplayedLines] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setDisplayedLines(0);
      const interval = setInterval(() => {
        setDisplayedLines(prev => {
          if (prev < briefingText.length) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center font-mono p-4"
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20" />

          <div className="relative w-full max-w-3xl border border-cyan-500/50 bg-cyan-950/30 p-8 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

            <div className="flex items-center gap-4 mb-8 border-b border-cyan-900/50 pb-4">
              <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold text-cyan-300 tracking-[0.4em] uppercase">Executive Briefing</h2>
                <div className="text-[10px] text-cyan-500/60 tracking-widest mt-1 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> SECURE CHANNEL ESTABLISHED
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-h-[300px]">
              {briefingText.slice(0, displayedLines).map((line, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm tracking-widest uppercase ${
                    line.includes('->') ? 'text-cyan-100 ml-4' : 
                    line.includes('NOMINAL') ? 'text-emerald-400 font-bold mt-4' : 
                    'text-cyan-400'
                  }`}
                >
                  {line}
                </motion.div>
              ))}
              {displayedLines < briefingText.length && (
                <motion.div 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-3 h-4 bg-cyan-400 mt-1"
                />
              )}
            </div>

            {displayedLines >= briefingText.length && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="mt-8 px-8 py-3 bg-cyan-950/50 border border-cyan-400 text-cyan-300 text-xs tracking-[0.3em] uppercase hover:bg-cyan-900 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-3 mx-auto"
              >
                <Cpu className="w-4 h-4" /> Acknowledge
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BriefingOverlay;
