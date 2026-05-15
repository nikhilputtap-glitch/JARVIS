import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, ShieldCheck, ShieldAlert, Hand, Mic, AlertTriangle } from 'lucide-react';
import WeatherWidget from './WeatherWidget';
import CalendarWidget from './CalendarWidget';
import EmailWidget from './EmailWidget';
import TodoWidget from './TodoWidget';
import DiagnosticsWidget from './DiagnosticsWidget';
import NewsFeedWidget from './NewsFeedWidget';
import ProtocolsWidget from './ProtocolsWidget';
import HologramWidget from './HologramWidget';
import VisionHUDWidget from './VisionHUDWidget';
import SatelliteWidget from './SatelliteWidget';
import BriefingOverlay from './BriefingOverlay';
import QuantumCryptoWidget from './QuantumCryptoWidget';
import BiometricsWidget from './BiometricsWidget';
import NeuralActivationWidget from './NeuralActivationWidget';
import DepthMapWidget from './DepthMapWidget';
import { auth, signInWithGoogle, logOut } from '../../services/firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useSpatialAudio } from '../../hooks/useSpatialAudio';

interface DashboardProps {
  isListening: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isListening }) => {
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // New Sci-Fi Features State
  const [overwatchAlert, setOverwatchAlert] = useState<any>(null);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);

  const { playSpatialSound } = useSpatialAudio();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleOverwatch = (e: Event) => {
      const customEvent = e as CustomEvent;
      setOverwatchAlert(customEvent.detail);
    };

    const handleGesture = (e: Event) => {
      const customEvent = e as CustomEvent;
      const gesture = customEvent.detail;
      
      if (gesture === 'swipe') {
        setGestureFeedback('SWIPE DETECTED: SCREEN SHIFT');
        playSpatialSound(20, 50, 0, 'hum');
        // Simulate screen shift by scrolling
        const container = document.getElementById('dashboard-scroll-container');
        if (container) {
          container.scrollBy({ top: 300, behavior: 'smooth' });
        }
      } else if (gesture === 'pinch') {
        setGestureFeedback('PINCH DETECTED: WIDGET CLOSED');
        playSpatialSound(80, 50, 0, 'beep');
        // Simulate closing a widget (just visual feedback for now)
      } else if (gesture === 'open-hand') {
        setIsMuted(prev => !prev);
        setGestureFeedback('OPEN HAND DETECTED: AUDIO TOGGLED');
        playSpatialSound(50, 50, 0, 'scan');
      }
      
      setTimeout(() => setGestureFeedback(null), 3000);
    };

    window.addEventListener('overwatch-alert', handleOverwatch);
    window.addEventListener('jarvis-gesture', handleGesture);

    return () => {
      unsubscribe();
      window.removeEventListener('overwatch-alert', handleOverwatch);
      window.removeEventListener('jarvis-gesture', handleGesture);
    };
  }, []);

  const handleAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (user) {
        await logOut();
        window.location.reload(); // Reload to clear states
      } else {
        const result = await signInWithGoogle();
        if (result) {
          window.location.reload(); // Reload to fetch emails with new token
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked. Please allow popups for this site to authenticate.");
      } else if (error.message?.includes('Pending promise was never set')) {
        setAuthError("Authentication interrupted. Please try again.");
      } else {
        setAuthError(error.message || "Authentication failed.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full p-4 md:p-8 flex flex-col font-mono text-cyan-500 relative"
    >
      {/* Overwatch Alert Overlay */}
      <AnimatePresence>
        {overwatchAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center border-4 border-red-500"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay animate-[scan_10s_linear_infinite]" />
            <div className="text-center p-8 bg-black/60 border border-red-500/50 max-w-2xl relative z-10">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl font-bold text-red-400 tracking-[0.3em] uppercase mb-4">
                Overwatch Alert
              </h2>
              <p className="text-xl text-red-300 tracking-widest mb-8">
                Sir, you have a meeting in less than 5 minutes.
                <br /><br />
                <span className="text-white font-bold">{overwatchAlert.title}</span> at {overwatchAlert.time}
              </p>
              <p className="text-sm text-red-500/80 tracking-widest mb-8 animate-pulse">
                Shall I prepare the briefing?
              </p>
              <div className="flex justify-center gap-6">
                <button 
                  onClick={() => {
                    setOverwatchAlert(null);
                    setIsBriefingOpen(true);
                  }}
                  className="px-8 py-3 bg-red-900/40 hover:bg-red-800/60 border border-red-500 text-white tracking-widest uppercase transition-colors"
                >
                  Yes, Prepare Briefing
                </button>
                <button 
                  onClick={() => setOverwatchAlert(null)}
                  className="px-8 py-3 bg-black/40 hover:bg-black/60 border border-red-900 text-red-500 tracking-widest uppercase transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Feedback Toast */}
      <AnimatePresence>
        {gestureFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/80 border border-cyan-400 px-6 py-3 flex items-center gap-4 shadow-[0_0_20px_#22d3ee]"
          >
            <Hand className="w-5 h-5 text-cyan-300 animate-pulse" />
            <span className="text-cyan-300 tracking-widest font-bold text-sm">
              {gestureFeedback}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-end border-b border-cyan-900/50 pb-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.3em] uppercase text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            Main Console
          </h1>
          <p className="text-[10px] tracking-[0.2em] opacity-60 mt-1 flex items-center gap-2">
            SYS.VER: 7.4.2 // UPLINK: SECURE // AUTH: {user ? user.displayName?.toUpperCase() : 'PENDING'}
            {isMuted && <span className="text-red-400 font-bold ml-2">[AUDIO MUTED]</span>}
            {isListening && <span className="text-emerald-400 font-bold ml-2 flex items-center gap-1"><Mic className="w-3 h-3 animate-pulse" /> [LISTENING]</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {authError && (
            <div className="text-red-400 text-[10px] tracking-widest bg-red-950/30 border border-red-500/50 px-3 py-1 animate-pulse flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> {authError}
              <button onClick={() => setAuthError(null)} className="ml-2 hover:text-red-300"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleAuth}
              disabled={isAuthenticating}
              className={`px-4 py-2 border text-[10px] tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${user ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-red-950/30 border-red-500/50 text-red-400 hover:bg-red-900/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'} ${isAuthenticating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {user ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {isAuthenticating ? 'Processing...' : (user ? 'Disconnect' : 'Authenticate')}
            </button>
            <button 
              onClick={() => setIsBriefingOpen(true)}
              className="px-6 py-2 bg-cyan-950/30 border border-cyan-500/50 text-cyan-400 text-[10px] tracking-[0.2em] uppercase hover:bg-cyan-900/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Daily Briefing
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div id="dashboard-scroll-container" className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
        
        {/* Large Feature: Hologram */}
        <div className="md:col-span-2 lg:col-span-3 row-span-2 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:border-cyan-500/40 transition-all duration-500">
          <HologramWidget />
        </div>

        {/* Small Feature: Biometrics */}
        <div className="md:col-span-2 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <BiometricsWidget />
        </div>

        {/* Small Feature: Diagnostics */}
        <div className="md:col-span-2 lg:col-span-2 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-400/40 transition-all duration-500">
          <DiagnosticsWidget />
        </div>

        {/* Medium Feature: Vision HUD */}
        <div className="md:col-span-2 lg:col-span-3 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <VisionHUDWidget />
        </div>

        {/* Small Feature: Weather */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <WeatherWidget />
        </div>

        {/* Small Feature: Todo */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <TodoWidget />
        </div>

        {/* Medium Feature: News */}
        <div className="md:col-span-2 lg:col-span-2 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <NewsFeedWidget />
        </div>

        {/* Small Feature: Protocols */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <ProtocolsWidget />
        </div>

        {/* Small Feature: Quantum Crypto */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <QuantumCryptoWidget />
        </div>

        {/* Small Feature: Satellite */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <SatelliteWidget />
        </div>

        {/* Small Feature: Calendar */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <CalendarWidget />
        </div>

        {/* Small Feature: Email */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <EmailWidget />
        </div>

        {/* Small Feature: Depth Map */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <DepthMapWidget />
        </div>

        {/* Small Feature: Neural Activation */}
        <div className="md:col-span-1 lg:col-span-1 row-span-1 bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl hover:border-cyan-500/40 transition-all duration-500">
          <NeuralActivationWidget />
        </div>
      </div>

      <BriefingOverlay isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
    </motion.div>
  );
};

export default Dashboard;
