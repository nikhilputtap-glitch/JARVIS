import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Unlock, AlertTriangle, RefreshCw } from 'lucide-react';
import { signInWithGoogle } from '../../services/firebaseService';

interface Email {
  id: string;
  sender: string;
  subject: string;
  encrypted: boolean;
}

const mockEmails = [
  { id: '1', sender: 'STARK IND.', subject: 'Q3 EARNINGS REPORT', encrypted: true },
  { id: '2', sender: 'S.H.I.E.L.D.', subject: 'PROTOCOL 10 INITIATED', encrypted: true },
  { id: '3', sender: 'PEPPER P.', subject: 'DINNER RESERVATION', encrypted: false },
];

const EmailWidget: React.FC = () => {
  const [decryptedIds, setDecryptedIds] = useState<string[]>([]);
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEmails = async () => {
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      setError('AUTH REQUIRED');
      setEmails([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3&q=is:unread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('google_access_token');
        throw new Error('AUTH EXPIRED');
      }
      if (!res.ok) throw new Error('Failed to fetch emails');
      
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const emailDetails = await Promise.all(
          data.messages.map(async (msg: any) => {
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const msgData = await msgRes.json();
            const headers = msgData.payload.headers;
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'NO SUBJECT';
            let sender = headers.find((h: any) => h.name === 'From')?.value || 'UNKNOWN';
            // Clean up sender (e.g., "John Doe <john@example.com>" -> "John Doe")
            sender = sender.split('<')[0].trim().toUpperCase();
            
            return {
              id: msg.id,
              sender: sender.length > 15 ? sender.substring(0, 15) + '...' : sender,
              subject: subject.length > 30 ? subject.substring(0, 30) + '...' : subject,
              encrypted: Math.random() > 0.5 // Randomly "encrypt" some for cinematic effect
            };
          })
        );
        setEmails(emailDetails);
      } else {
        setEmails([]);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'AUTH EXPIRED') {
        setError('AUTH EXPIRED');
      } else {
        setError('UPLINK FAILED');
      }
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Poll every 30 seconds
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cinematic decryption effect
    if (emails.length > 0) {
      setDecryptedIds([]);
      emails.forEach((email, index) => {
        if (email.encrypted) {
          setTimeout(() => {
            setDecryptedIds(prev => [...prev, email.id]);
          }, 2000 + (index * 1500));
        }
      });
    }
  }, [emails]);

  const handleReauth = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        fetchEmails();
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
      transition={{ delay: 0.3 }}
      className="relative bg-cyan-950/20 border border-cyan-500/30 p-5 rounded-none backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-6 border-b border-cyan-900/50 pb-4">
        <h3 className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
          <Mail className="w-4 h-4" /> Comm.Intercept
        </h3>
        <span className="text-[9px] text-cyan-500/60 tracking-widest animate-pulse">
          {loading ? 'SCANNING...' : `${emails.length} UNREAD`}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {error ? (
          <div className="flex flex-col gap-2 text-red-400 text-xs tracking-widest p-4 bg-red-950/20 border border-red-900/50">
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
        ) : emails.length === 0 ? (
          <div className="text-xs tracking-widest uppercase text-cyan-500/50 text-center py-4">
            NO UNREAD COMMUNIQUES
          </div>
        ) : (
          emails.map((email) => {
            const isDecrypted = !email.encrypted || decryptedIds.includes(email.id);
            return (
              <div key={email.id} className="bg-[#020617]/50 border border-cyan-900/30 p-3 relative overflow-hidden group">
                {/* Scan effect on hover */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]" />
                
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-cyan-300 tracking-widest uppercase">
                    {email.sender}
                  </span>
                  {isDecrypted ? (
                    <Unlock className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <div className="text-xs tracking-widest uppercase">
                  {isDecrypted ? (
                    <span className="text-white">{email.subject}</span>
                  ) : (
                    <span className="text-red-400/80 font-mono">
                      {email.subject.replace(/[A-Z0-9]/gi, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)))}
                    </span>
                  )}
                </div>
                {!isDecrypted && (
                  <div className="mt-2 h-1 w-full bg-red-950 overflow-hidden">
                    <div className="h-full bg-red-500 w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>
            );
          })
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

export default EmailWidget;
