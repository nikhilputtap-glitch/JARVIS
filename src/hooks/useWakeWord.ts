import { useState, useEffect } from 'react';

export const useWakeWord = (onWake: () => void) => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('jarvis')) {
        onWake();
      }
    };

    if (isListening) recognition.start();
    else recognition.stop();

    return () => recognition.stop();
  }, [isListening, onWake]);

  return { isListening, setIsListening };
};
