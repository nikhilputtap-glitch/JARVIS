import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Zap, Lock, Unlock, AlertTriangle } from 'lucide-react';

const ProtocolsWidget: React.FC = () => {
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  useEffect(() => {
    const handleProtocolEvent = (e: any) => {
      const protocol = e.detail;
      setActiveProtocol(protocol);
    };
    window.addEventListener('jarvis-protocol', handleProtocolEvent);
    return () => window.removeEventListener('jarvis-protocol', handleProtocolEvent);
  }, []);

  const triggerProtocol = (protocol: string) => {
    if (activeProtocol === protocol) {
      setActiveProtocol(null);
      document.body.classList.remove('lockdown-mode', 'party-mode');
      return;
    }
    
    setActiveProtocol(protocol);
    document.body.classList.remove('lockdown-mode', 'party-mode');
    
    if (protocol === 'LOCKDOWN') {
      document.body.classList.add('lockdown-mode');
    } else if (protocol === 'HOUSE PARTY') {
      document.body.classList.add('party-mode');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className={`relative border p-5 rounded-none backdrop-blur-sm transition-colors duration-500 ${
        activeProtocol === 'LOCKDOWN' 
          ? 'bg-red-950/20 border-red-500/50' 
          : activeProtocol === 'HOUSE PARTY'
          ? 'bg-fuchsia-950/20 border-fuchsia-500/50'
          : 'bg-cyan-950/20 border-cyan-500/30'
      }`}
    >
      <div className={`flex justify-between items-start mb-6 border-b pb-4 transition-colors duration-500 ${
        activeProtocol === 'LOCKDOWN' ? 'border-red-900/50' : activeProtocol === 'HOUSE PARTY' ? 'border-fuchsia-900/50' : 'border-cyan-900/50'
      }`}>
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 transition-colors duration-500 ${
          activeProtocol === 'LOCKDOWN' ? 'text-red-400' : activeProtocol === 'HOUSE PARTY' ? 'text-fuchsia-400' : 'text-cyan-400'
        }`}>
          <ShieldAlert className="w-4 h-4" /> House.Protocols
        </h3>
        <span className={`text-[9px] tracking-widest transition-colors duration-500 ${
          activeProtocol === 'LOCKDOWN' ? 'text-red-500/60 animate-pulse' : activeProtocol === 'HOUSE PARTY' ? 'text-fuchsia-500/60 animate-pulse' : 'text-cyan-500/60'
        }`}>
          {activeProtocol ? 'ENGAGED' : 'STANDBY'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => triggerProtocol('LOCKDOWN')}
          className={`relative p-4 border flex flex-col items-center justify-center gap-2 transition-all duration-300 group ${
            activeProtocol === 'LOCKDOWN' 
              ? 'bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
              : 'bg-cyan-950/30 border-cyan-900/50 hover:border-red-500/50 hover:bg-red-950/20'
          }`}
        >
          <Lock className={`w-6 h-6 transition-colors ${activeProtocol === 'LOCKDOWN' ? 'text-red-400 animate-pulse' : 'text-cyan-500/60 group-hover:text-red-400'}`} />
          <span className={`text-[9px] tracking-widest uppercase font-bold transition-colors ${activeProtocol === 'LOCKDOWN' ? 'text-red-300' : 'text-cyan-500/80 group-hover:text-red-300'}`}>
            Lockdown
          </span>
          {activeProtocol === 'LOCKDOWN' && (
            <div className="absolute inset-0 border border-red-500 animate-ping opacity-20" />
          )}
        </button>

        <button
          onClick={() => triggerProtocol('HOUSE PARTY')}
          className={`relative p-4 border flex flex-col items-center justify-center gap-2 transition-all duration-300 group ${
            activeProtocol === 'HOUSE PARTY' 
              ? 'bg-fuchsia-900/40 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
              : 'bg-cyan-950/30 border-cyan-900/50 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/20'
          }`}
        >
          <Zap className={`w-6 h-6 transition-colors ${activeProtocol === 'HOUSE PARTY' ? 'text-fuchsia-400 animate-pulse' : 'text-cyan-500/60 group-hover:text-fuchsia-400'}`} />
          <span className={`text-[9px] tracking-widest uppercase font-bold transition-colors ${activeProtocol === 'HOUSE PARTY' ? 'text-fuchsia-300' : 'text-cyan-500/80 group-hover:text-fuchsia-300'}`}>
            House Party
          </span>
          {activeProtocol === 'HOUSE PARTY' && (
            <div className="absolute inset-0 border border-fuchsia-500 animate-ping opacity-20" />
          )}
        </button>
      </div>

      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors duration-500 ${activeProtocol === 'LOCKDOWN' ? 'border-red-400' : activeProtocol === 'HOUSE PARTY' ? 'border-fuchsia-400' : 'border-cyan-400'}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors duration-500 ${activeProtocol === 'LOCKDOWN' ? 'border-red-400' : activeProtocol === 'HOUSE PARTY' ? 'border-fuchsia-400' : 'border-cyan-400'}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors duration-500 ${activeProtocol === 'LOCKDOWN' ? 'border-red-400' : activeProtocol === 'HOUSE PARTY' ? 'border-fuchsia-400' : 'border-cyan-400'}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors duration-500 ${activeProtocol === 'LOCKDOWN' ? 'border-red-400' : activeProtocol === 'HOUSE PARTY' ? 'border-fuchsia-400' : 'border-cyan-400'}`} />
    </motion.div>
  );
};

export default ProtocolsWidget;
