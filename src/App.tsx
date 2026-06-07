/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLiveAPI } from './hooks/useLiveAPI';
import { useWakeWord } from './hooks/useWakeWord';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { Mic, Power, ExternalLink, AlertTriangle, Activity, Maximize, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState, useRef } from 'react';
import Dashboard from './components/dashboard/Dashboard';

const TelemetryStream = ({ align = 'left' }: { align?: 'left' | 'right' }) => {
  const [data, setData] = useState<string[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newStream = [...prev, `0x${Math.random().toString(16).substring(2, 10).toUpperCase()} : ${Math.floor(Math.random() * 100)}%`];
        return newStream.slice(-12);
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={`flex flex-col text-[10px] opacity-40 text-cyan-500 font-mono ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {data.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
};

const LiveGraph = () => {
  const [points, setPoints] = useState<number[]>(Array(20).fill(50));
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => {
        const next = [...prev.slice(1), Math.max(10, Math.min(90, prev[prev.length - 1] + (Math.random() * 40 - 20)))];
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 border-t border-cyan-900/50 pt-2 w-32 h-16 flex items-end gap-[2px]">
      {points.map((p, i) => (
        <div key={i} className="w-full bg-cyan-500/40" style={{ height: `${p}%` }} />
      ))}
    </div>
  );
};

const SecurityScanner = () => {
  return (
    <div className="mt-4 border-t border-cyan-900/50 pt-2 flex items-center gap-2 text-[10px] text-cyan-400">
      <ShieldCheck className="w-4 h-4 text-emerald-400" />
      <div>
        <div>SEC. PROTOCOL: ACTIVE</div>
        <div className="opacity-60">BIOMETRIC LOCK ENGAGED</div>
      </div>
    </div>
  );
};

const TasksWidget = () => {
  const [tasks, setTasks] = useState<string[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem('jarvis_todos') || '[]');
      setTasks(stored);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (tasks.length === 0) return null;
  return (
    <div className="mt-4 border-t border-cyan-900/50 pt-2">
      <div className="text-[10px] text-cyan-400 mb-1">ACTIVE TASKS:</div>
      <div className="flex flex-col gap-1 text-[10px] opacity-70">
        {tasks.slice(0, 5).map((t, i) => <div key={i}>- {t}</div>)}
        {tasks.length > 5 && <div>...and {tasks.length - 5} more</div>}
      </div>
    </div>
  );
};

const NotesWidget = () => {
  const [notes, setNotes] = useState<any[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
      setNotes(stored);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (notes.length === 0) return null;
  return (
    <div className="mt-4 border-t border-cyan-900/50 pt-2 text-right">
      <div className="text-[10px] text-cyan-400 mb-1">RECENT NOTES:</div>
      <div className="flex flex-col gap-1 text-[10px] opacity-70">
        {notes.slice(-3).reverse().map((n, i) => <div key={i}>{n.content.substring(0, 30)}{n.content.length > 30 ? '...' : ''}</div>)}
      </div>
    </div>
  );
};

const AnalysisWidget = ({ analysis }: { analysis: { sentiment: string, intent: string } | null }) => {
  return (
    <div className="mt-4 border-t border-cyan-900/50 pt-2 w-48 text-[10px] text-cyan-400">
      <div className="opacity-60">AI ANALYSIS:</div>
      <div className="flex justify-between">
        <span>SENTIMENT:</span>
        <span className="text-cyan-200">{analysis ? analysis.sentiment.toUpperCase() : 'PENDING'}</span>
      </div>
      <div className="flex justify-between">
        <span>INTENT:</span>
        <span className="text-cyan-200">{analysis ? analysis.intent.toUpperCase() : 'PENDING'}</span>
      </div>
    </div>
  );
};

export default function App() {
  const { connected, connecting, error, connect, disconnect, volume, appToOpen, setAppToOpen, videoRef, session, analysis } = useLiveAPI();
  const { executeCommand } = useVoiceCommands(session);
  const { isListening, setIsListening } = useWakeWord(() => {
    if (!connected) connect();
    setIsListening(true);
  });
  const [showDashboard, setShowDashboard] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => {
        if (track.kind === 'audio') track.stop();
      });
      setMicPermissionGranted(true);
    } catch (err) {
      console.error("Permission denied:", err);
      alert("Microphone and camera access are required to use JARVIS. Please allow them in your browser settings.");
    }
  };

  const togglePushToTalk = () => {
    setIsPushToTalk(!isPushToTalk);
    if (!isPushToTalk) {
      setIsListening(true);
      connect();
    } else {
      setIsListening(false);
      disconnect();
    }
  };

  useEffect(() => {
    // Play silent audio to keep the tab alive in the background
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    audio.loop = true;
    audio.volume = 0.01;
    
    const playAudio = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
    };
    document.addEventListener('click', playAudio);
    document.addEventListener('touchstart', playAudio);
    
    return () => {
      audio.pause();
      document.removeEventListener('click', playAudio);
      document.removeEventListener('touchstart', playAudio);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen text-cyan-500 flex flex-col items-center justify-center font-mono relative overflow-hidden selection:bg-cyan-900"
    >
      
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-10" />

      {/* Top Left HUD */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute top-8 left-8 flex flex-col gap-4 z-10 hidden md:flex"
      >
        <div className="flex flex-col gap-1 text-xs tracking-[0.2em] opacity-80">
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> SYS.CORE: ONLINE</div>
          <div className="pl-6">MEM.CAP: 94.2%</div>
          <div className="pl-6">NET.UPLINK: STABLE</div>
        </div>
        <TelemetryStream align="left" />
        <LiveGraph />
        <TasksWidget />
        <AnalysisWidget analysis={analysis} />
      </motion.div>

      {/* Top Right HUD */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute top-8 right-8 flex flex-col gap-4 z-10 hidden md:flex items-end"
      >
        <div className="flex flex-col gap-1 text-xs tracking-[0.2em] opacity-80 text-right">
          <div>MK. VII PROTOCOL</div>
          <div>AUTH: NIKHIL</div>
          <div className={`mt-1 font-bold ${connected ? 'text-cyan-300 animate-pulse' : 'text-cyan-700'}`}>
            {connected ? 'LINK ESTABLISHED' : connecting ? 'INITIALIZING...' : 'STANDBY MODE'}
          </div>
        </div>
        <TelemetryStream align="right" />
        <SecurityScanner />
        <NotesWidget />
      </motion.div>

      {/* Fullscreen Button */}
      <button 
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }}
        className="absolute top-8 right-8 md:top-auto md:bottom-8 md:right-8 z-50 p-3 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-900/50 hover:text-cyan-300 transition-all backdrop-blur-sm"
      >
        <Maximize className="w-5 h-5" />
      </button>

      {/* Dashboard Toggle Button */}
      <button 
        onClick={() => setShowDashboard(!showDashboard)}
        className="absolute top-8 right-20 md:top-auto md:bottom-8 md:right-20 z-50 p-3 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-500 hover:bg-cyan-900/50 hover:text-cyan-300 transition-all backdrop-blur-sm"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {/* Dashboard View */}
      {showDashboard && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-md pt-20">
          <Dashboard isListening={isListening} onClose={() => setShowDashboard(false)} />
        </div>
      )}

      {/* Permission Overlay */}
      {!micPermissionGranted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="text-center max-w-md p-8 border border-cyan-900/50 bg-cyan-950/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold tracking-[0.3em] text-cyan-400 mb-2 uppercase">Audio/Vision Interface</h2>
            <p className="text-cyan-500/70 text-xs tracking-widest uppercase mb-8 leading-relaxed">
              JARVIS requires microphone and camera access to establish voice and vision uplink.
            </p>
            <button
              onClick={requestMicPermission}
              className="px-8 py-3 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] uppercase tracking-[0.2em] text-xs transition-all duration-300"
            >
              Initialize Link
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none" />

      {/* Central Arc Reactor / Voice Visualizer (Cinematic Mark 85 Nanotech Style) */}
      <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center z-20">
        
        {/* Ambient Deep Glow */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-1000 ${connected ? 'opacity-100' : 'opacity-40'}`} style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(2,6,23,0) 70%)', filter: 'blur(30px)' }} />

        {/* Outer Nanotech Metallic Housing */}
        <div className="absolute inset-4 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,1),0_0_20px_rgba(34,211,238,0.3)] border border-cyan-900/50" style={{ background: 'conic-gradient(from 0deg, #020617, #0f172a, #1e293b, #0f172a, #020617, #0f172a, #1e293b, #0f172a, #020617)' }} />

        {/* Energy Dispersal Sweep (Fast Rotating Conic Gradient) */}
        {connected && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full opacity-80 mix-blend-screen"
            style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(34,211,238,0.9) 100%)', maskImage: 'radial-gradient(transparent 68%, black 69%)', WebkitMaskImage: 'radial-gradient(transparent 68%, black 69%)' }}
          />
        )}

        {/* Nanotech Angular Nodes (12 points) */}
        <div className="absolute inset-6 rounded-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 w-2 h-full -ml-1"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div className={`w-full h-8 rounded-b-full transition-all duration-300 ${connected ? 'bg-cyan-300 shadow-[0_0_15px_#22d3ee]' : 'bg-cyan-900/50'}`} />
            </div>
          ))}
        </div>

        {/* Inner Mechanical Ring */}
        <div className="absolute inset-16 rounded-full border-[10px] border-[#020617] shadow-[inset_0_0_20px_rgba(34,211,238,0.4),0_0_10px_rgba(0,0,0,0.8)]" />

        {/* Hexagonal Grid Overlay (Nanotech texture) */}
        <div className="absolute inset-20 rounded-full opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'34.641\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 0L20 5.774v11.547L10 23.094 0 17.321V5.774z\' fill=\'none\' stroke=\'%2322d3ee\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '20px 34.64px' }} />

        {/* Fast Rotating Containment Fields */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-20 rounded-full border-[3px] border-cyan-500/40 border-dashed"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[92px] rounded-full border-[2px] border-cyan-300/60 border-dotted"
        />

        {/* The Core (Heart) - Highly Reactive */}
        <motion.div
          animate={{
            scale: connected ? 1 + volume * 0.15 : 1,
            boxShadow: connected
              ? `0 0 ${80 + volume * 150}px ${30 + volume * 80}px rgba(34, 211, 238, ${0.6 + volume}), inset 0 0 ${60 + volume * 60}px ${20 + volume * 30}px rgba(255, 255, 255, 1)`
              : '0 0 40px 10px rgba(34, 211, 238, 0.2), inset 0 0 20px 5px rgba(255, 255, 255, 0.3)'
          }}
          className={`absolute inset-[110px] rounded-full flex items-center justify-center transition-all duration-200 ${connected ? 'bg-white' : 'bg-cyan-950 border-2 border-cyan-500/50'}`}
        >
          {/* Intense Center Emitter */}
          <div className={`absolute inset-2 rounded-full transition-all duration-300 ${connected ? 'bg-cyan-100/90 blur-[2px]' : 'bg-transparent'}`} />
          
          <div className="relative z-10">
            {connecting ? (
              <div className="text-cyan-900 font-bold text-[10px] tracking-[0.2em] animate-pulse">INIT</div>
            ) : connected ? (
              <Mic className="w-8 h-8 md:w-10 md:h-10 text-cyan-900 opacity-90 drop-shadow-md" />
            ) : (
              <Power className="w-8 h-8 md:w-10 md:h-10 text-cyan-500/60" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Status / Controls */}
      <div className="absolute bottom-12 flex flex-col items-center gap-8 z-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.4em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] mb-3">J.A.R.V.I.S.</h1>
          <p className="text-cyan-500/60 text-xs md:text-sm tracking-[0.3em] uppercase">
            {connected ? 'Awaiting Command...' : connecting ? 'Establishing Link...' : 'Say "Jarvis" to wake'}
          </p>
        </div>

        {/* Manual Connect/Disconnect Button */}
        <div className="flex gap-4">
          <button
            onClick={() => connected ? disconnect() : connect()}
            className={`px-8 py-3 bg-transparent border ${connected ? 'border-red-500/50 text-red-400 hover:bg-red-950/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'} uppercase tracking-[0.2em] text-xs transition-all duration-300 backdrop-blur-sm`}
          >
            {connected ? 'Terminate Link' : 'Manual Override'}
          </button>
          
          <button
            onClick={togglePushToTalk}
            className={`px-8 py-3 border ${isPushToTalk ? 'border-red-500/50 text-red-400' : 'border-cyan-500/50 text-cyan-400'} uppercase tracking-[0.2em] text-xs transition-all duration-300 backdrop-blur-sm`}
          >
            {isPushToTalk ? 'Stop Listening' : 'Push-to-Talk'}
          </button>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 z-50 bg-red-950/80 border border-red-500/50 text-red-400 p-4 rounded-none backdrop-blur-md max-w-md text-center text-xs tracking-widest uppercase"
        >
          <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
          {error}
          <button onClick={() => connect()} className="mt-4 block mx-auto px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-white text-[10px] uppercase tracking-widest border border-red-500/30 transition-all">Retry Connection</button>
        </motion.div>
      )}

      {/* App Open Toast */}
      {appToOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 z-50 bg-cyan-950/90 border border-cyan-400 p-6 rounded-none shadow-[0_0_30px_rgba(34,211,238,0.3)] flex flex-col items-center gap-4 backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Popup Blocked</span>
          </div>
          <p className="text-cyan-100 text-sm tracking-widest uppercase text-center">JARVIS is attempting to access<br/><strong className="text-lg text-cyan-400">{appToOpen.name}</strong></p>
          <p className="text-cyan-400/70 text-[10px] tracking-widest text-center max-w-xs uppercase">
            Override required. Click the lock icon in the address bar and Allow Pop-ups.
          </p>
          <div className="flex gap-4 mt-4">
            <a 
              href={appToOpen.url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={() => setAppToOpen(null)}
              className="px-6 py-2 bg-cyan-500 text-black font-bold text-xs tracking-widest uppercase hover:bg-cyan-400 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Execute
            </a>
            <button 
              onClick={() => setAppToOpen(null)}
              className="px-6 py-2 border border-cyan-500/50 text-cyan-400 font-bold text-xs tracking-widest uppercase hover:bg-cyan-900/50 transition-colors"
            >
              Abort
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
