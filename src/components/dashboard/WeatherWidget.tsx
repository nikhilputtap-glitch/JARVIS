import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CloudRain, Wind, Droplets, Sun } from 'lucide-react';
import axios from 'axios';

const WeatherWidget: React.FC = () => {
  const [data, setData] = useState<{ temp: number, humidity: number, wind: number, description: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      // Default to a location (e.g., San Francisco) if geolocation is not available
      const lat = 37.7749;
      const lon = -122.4194;
      try {
        const response = await axios.get(`/api/weather?lat=${lat}&lon=${lon}`);
        setData({
          temp: response.data.main.temp,
          humidity: response.data.main.humidity,
          wind: response.data.wind.speed,
          description: response.data.weather[0].description
        });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Fetch every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-cyan-400 text-xs">Loading weather...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm overflow-hidden group"
    >
      {/* Scanning line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]" />
      
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Sun className="w-4 h-4" /> Atmos.Data
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">LIVE</span>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <div className="text-5xl font-light text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          {data.temp.toFixed(1)}°
        </div>
        <div className="text-xs text-cyan-400/80 tracking-widest mb-2 uppercase">
          {data.description}<br/>Sector 7G
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-cyan-900/50 pt-4">
        <div className="flex items-center gap-3">
          <Droplets className="w-4 h-4 text-cyan-500/60" />
          <div>
            <div className="text-[9px] text-cyan-500/50 tracking-widest uppercase">Humidity</div>
            <div className="text-xs text-cyan-300 font-bold">{Math.round(data.humidity)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Wind className="w-4 h-4 text-cyan-500/60" />
          <div>
            <div className="text-[9px] text-cyan-500/50 tracking-widest uppercase">Wind Spd</div>
            <div className="text-xs text-cyan-300 font-bold">{data.wind.toFixed(1)} km/h</div>
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

export default WeatherWidget;
