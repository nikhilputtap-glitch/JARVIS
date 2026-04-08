import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { signInWithGoogle } from '../../services/firebaseService';

interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
}

const CalendarWidget: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      setError('AUTH REQUIRED');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=4&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('google_access_token');
        throw new Error('AUTH EXPIRED');
      }
      if (!res.ok) throw new Error('Failed to fetch calendar');
      
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const parsedEvents = data.items.map((item: any) => {
          const start = new Date(item.start.dateTime || item.start.date);
          const end = new Date(item.end.dateTime || item.end.date);
          const now = new Date();
          
          let status: 'ACTIVE' | 'PENDING' | 'COMPLETED' = 'PENDING';
          if (now >= start && now <= end) status = 'ACTIVE';
          else if (now > end) status = 'COMPLETED';

          return {
            id: item.id,
            rawStart: start,
            time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            title: item.summary ? (item.summary.length > 20 ? item.summary.substring(0, 20) + '...' : item.summary) : 'UNKNOWN EVENT',
            status
          };
        });
        setEvents(parsedEvents);

        // Overwatch Mode: Check for upcoming meetings in <= 5 mins
        const upcomingEvent = parsedEvents.find((e: any) => e.status === 'PENDING');
        if (upcomingEvent && upcomingEvent.rawStart) {
          const timeDiff = upcomingEvent.rawStart.getTime() - new Date().getTime();
          if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
            window.dispatchEvent(new CustomEvent('overwatch-alert', { detail: upcomingEvent }));
          }
        }
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'AUTH EXPIRED') {
        setError('AUTH EXPIRED');
      } else {
        setError('UPLINK FAILED');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const handleReauth = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        fetchEvents();
      }
    } catch (err: any) {
      console.error("Re-auth failed", err);
      if (err.code === 'auth/popup-blocked') {
        setError('POPUP BLOCKED. PLEASE ALLOW POPUPS.');
      } else if (err.message?.includes('Pending promise was never set')) {
        setError('AUTH INTERRUPTED. TRY AGAIN.');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Schedule.Log
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">
          {loading ? 'SYNCING...' : 'SYNCED'}
        </span>
      </div>

      <div className="flex flex-col gap-4 relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-cyan-900/50" />

        {error ? (
          <div className="flex flex-col gap-2 text-red-400 text-xs tracking-widest p-4 bg-red-950/20 border border-red-900/50 z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
            {(error === 'AUTH EXPIRED' || error === 'AUTH REQUIRED' || error.includes('POPUP BLOCKED') || error.includes('AUTH INTERRUPTED')) && (
              <button 
                onClick={handleReauth}
                className="mt-2 px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> RECONNECT UPLINK
              </button>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className="text-xs tracking-widest uppercase text-cyan-500/50 text-center py-4 z-10">
            NO UPCOMING EVENTS
          </div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-4 relative z-10">
              <div className={`w-10 text-right text-[10px] tracking-widest ${ev.status === 'ACTIVE' ? 'text-cyan-300 font-bold' : 'text-cyan-500/60'}`}>
                {ev.time}
              </div>
              <div className={`w-2 h-2 rounded-full border ${ev.status === 'ACTIVE' ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_10px_#22d3ee] animate-pulse' : ev.status === 'COMPLETED' ? 'bg-cyan-900 border-cyan-700' : 'bg-[#020617] border-cyan-700'}`} />
              <div className="flex-1 bg-cyan-950/30 border border-cyan-900/50 p-2 flex justify-between items-center">
                <span className={`text-xs tracking-widest uppercase ${ev.status === 'ACTIVE' ? 'text-white' : 'text-cyan-500/80'}`}>
                  {ev.title}
                </span>
                <span className={`text-[8px] tracking-widest uppercase ${ev.status === 'ACTIVE' ? 'text-cyan-300' : 'text-cyan-500/40'}`}>
                  {ev.status}
                </span>
              </div>
            </div>
          ))
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

export default CalendarWidget;
