import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Battery, BatteryCharging, Wifi, WifiOff, Cpu } from 'lucide-react';

const DiagnosticsWidget: React.FC = () => {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBattery({ level: batt.level * 100, charging: batt.charging });
        
        batt.addEventListener('levelchange', () => {
          setBattery((prev) => prev ? { ...prev, level: batt.level * 100 } : null);
        });
        batt.addEventListener('chargingchange', () => {
          setBattery((prev) => prev ? { ...prev, charging: batt.charging } : null);
        });
      });
    }

    // Network status
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Radar rotation
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 5) % 360);
    }, 50);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Activity className="w-4 h-4" /> Sys.Diagnostics
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">
          MONITORING
        </span>
      </div>

      <div className="flex gap-6 items-center">
        {/* Radar */}
        <div className="relative w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center overflow-hidden bg-cyan-950/20">
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />
          <div className="absolute w-16 h-16 rounded-full border border-cyan-500/20" />
          <div className="absolute w-8 h-8 rounded-full border border-cyan-500/20" />
          
          {/* Sweeper */}
          <div 
            className="absolute top-1/2 left-1/2 w-12 h-12 origin-top-left"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: 'conic-gradient(from 180deg at 0% 0%, transparent 0deg, rgba(34, 211, 238, 0.4) 90deg, transparent 90deg)'
            }}
          />
          
          {/* Blips */}
          <div className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full top-6 left-14 shadow-[0_0_5px_#22d3ee] animate-pulse" />
          <div className="absolute w-1 h-1 bg-cyan-500 rounded-full bottom-8 left-6 shadow-[0_0_5px_#22d3ee] animate-ping" />
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-500/80">
              {battery?.charging ? <BatteryCharging className="w-4 h-4" /> : <Battery className="w-4 h-4" />}
              <span className="text-[10px] tracking-widest uppercase">Power Core</span>
            </div>
            <span className="text-xs font-mono text-cyan-300">
              {battery ? `${Math.round(battery.level)}%` : 'CALCULATING'}
            </span>
          </div>
          
          <div className="w-full h-1 bg-cyan-950 overflow-hidden">
            <div 
              className={`h-full ${battery?.level && battery.level <= 20 ? 'bg-red-500' : 'bg-cyan-400'} shadow-[0_0_10px_#22d3ee] transition-all duration-1000`}
              style={{ width: `${battery?.level || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-cyan-500/80">
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className="text-[10px] tracking-widest uppercase">Uplink Status</span>
            </div>
            <span className={`text-[10px] tracking-widest uppercase ${online ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
              {online ? 'STABLE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-500/80">
              <Cpu className="w-4 h-4" />
              <span className="text-[10px] tracking-widest uppercase">Neural Net</span>
            </div>
            <span className="text-[10px] tracking-widest uppercase text-cyan-300">
              OPTIMAL
            </span>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
    </motion.div>
  );
};

export default DiagnosticsWidget;
