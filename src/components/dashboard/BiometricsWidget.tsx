import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HeartPulse, Activity } from 'lucide-react';

const BiometricsWidget: React.FC = () => {
  const [bpm, setBpm] = useState(72);
  const [stress, setStress] = useState(15);
  const [ecgData, setEcgData] = useState<number[]>(Array(50).fill(50));

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate BPM fluctuation
      setBpm(prev => {
        const newBpm = prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
        return Math.max(60, Math.min(120, newBpm));
      });

      // Simulate Stress fluctuation
      setStress(prev => {
        const newStress = prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
        return Math.max(5, Math.min(95, newStress));
      });

      // Simulate ECG wave
      setEcgData(prev => {
        const newData = [...prev.slice(1)];
        // Create a heartbeat spike every ~10 frames
        if (Math.random() > 0.85) {
          newData.push(80 + Math.random() * 20); // Peak
          newData.push(20 + Math.random() * 10); // Trough
        } else {
          newData.push(50 + (Math.random() * 10 - 5)); // Baseline noise
        }
        return newData;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-4 border-b border-cyan-900/50 pb-2">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <HeartPulse className="w-4 h-4" /> Biometric.Sync
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse flex items-center gap-1">
          <Activity className="w-3 h-3" /> LIVE
        </span>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="text-[10px] text-cyan-500/60 tracking-widest uppercase mb-1">Heart Rate</div>
          <div className="text-3xl font-light text-cyan-300 drop-shadow-[0_0_10px_#22d3ee]">
            {bpm} <span className="text-xs text-cyan-500/50">BPM</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-cyan-500/60 tracking-widest uppercase mb-1">Stress Level</div>
          <div className={`text-xl font-mono tracking-widest ${stress > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stress}%
          </div>
        </div>
      </div>

      {/* ECG Graph Simulation */}
      <div className="h-16 border border-cyan-900/50 bg-[#020617]/50 relative overflow-hidden flex items-end">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/20" style={{ top: '50%' }} />
        <div className="flex items-end h-full w-full px-1 gap-[2px]">
          {ecgData.map((val, i) => (
            <div 
              key={i} 
              className="w-full bg-cyan-400/80 transition-all duration-75"
              style={{ height: `${val}%`, opacity: i / ecgData.length }}
            />
          ))}
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

export default BiometricsWidget;
