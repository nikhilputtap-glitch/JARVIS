import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Satellite, MapPin, Activity } from 'lucide-react';

interface ISSData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

const SatelliteWidget: React.FC = () => {
  const [data, setData] = useState<ISSData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let simLat = Math.random() * 180 - 90;
    let simLng = Math.random() * 360 - 180;

    const updateSimulation = () => {
      simLat = simLat + 0.05;
      if (simLat > 90) simLat = -90;
      simLng = simLng + 0.05;
      if (simLng > 180) simLng = -180;
      
      setData({
        latitude: simLat,
        longitude: simLng,
        altitude: 418.5 + Math.sin(Date.now() / 5000) * 5,
        velocity: 27580 + Math.cos(Date.now() / 5000) * 50
      });
      setLoading(false);
    };

    updateSimulation();
    const interval = setInterval(updateSimulation, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Satellite className="w-4 h-4" /> Global.Tracking
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">
          {loading ? 'ACQUIRING...' : 'LOCKED: ISS'}
        </span>
      </div>

      <div className="flex flex-col gap-4 font-mono">
        <div className="bg-[#020617]/50 border border-cyan-900/30 p-3 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-cyan-500/60 tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" /> LATITUDE
            </span>
            <span className="text-xs text-cyan-300 tracking-widest">
              {data ? data.latitude.toFixed(4) : '---.----'}°
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-cyan-500/60 tracking-widest flex items-center gap-2">
              <MapPin className="w-3 h-3" /> LONGITUDE
            </span>
            <span className="text-xs text-cyan-300 tracking-widest">
              {data ? data.longitude.toFixed(4) : '---.----'}°
            </span>
          </div>

          <div className="w-full h-[1px] bg-cyan-900/50 my-2" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-cyan-500/60 tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> ALTITUDE
            </span>
            <span className="text-xs text-cyan-300 tracking-widest">
              {data ? data.altitude.toFixed(2) : '---.--'} KM
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-500/60 tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> VELOCITY
            </span>
            <span className="text-xs text-cyan-300 tracking-widest">
              {data ? data.velocity.toFixed(2) : '---.--'} KM/H
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

export default SatelliteWidget;
