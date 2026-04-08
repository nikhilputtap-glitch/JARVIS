import { useCallback } from 'react';

export const useVoiceCommands = (session: any) => {
  const executeCommand = useCallback((transcript: string) => {
    if (!session) return;
    if (session.then) {
      session.then((s: any) => s.sendRealtimeInput({ text: transcript }));
    } else {
      session.sendRealtimeInput({ text: transcript });
    }
  }, [session]);

  return { executeCommand };
};
