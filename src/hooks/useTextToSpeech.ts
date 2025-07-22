import { useState, useCallback } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string, options?: SpeechSynthesisUtterance) => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const updateVoices = useCallback(() => {
    if (isSupported) {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    }
  }, [isSupported]);

  // Load voices when they become available
  if (isSupported) {
    speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();
  }

  const speak = useCallback((text: string, options?: Partial<SpeechSynthesisUtterance>) => {
    if (!isSupported) {
      console.warn('Text-to-speech is not supported in this browser');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set default options
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;
    utterance.lang = options?.lang || 'en-US';

    // Find appropriate voice
    if (options?.voice) {
      utterance.voice = options.voice;
    } else {
      // Try to find a good English voice
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    isSpeaking,
    isSupported,
    voices,
    stop,
    pause,
    resume
  };
};