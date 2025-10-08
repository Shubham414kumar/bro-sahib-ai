import { useState, useCallback, useEffect } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string, options?: Partial<SpeechSynthesisUtterance> & { lang?: string }) => void;
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

  // Load voices when they become available - moved to useEffect
  useEffect(() => {
    if (isSupported) {
      speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
      
      // Cleanup function
      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [isSupported, updateVoices]);

  const speak = useCallback((text: string, options?: Partial<SpeechSynthesisUtterance> & { lang?: string }) => {
    if (!isSupported) {
      console.warn('Text-to-speech is not supported in this browser');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Enhanced voice settings for natural, lively tone
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1.2; // Slightly higher pitch for energetic feel
    utterance.volume = options?.volume || 1;
    utterance.lang = options?.lang || 'en-US';

    // Find appropriate voice based on language
    if (options?.voice) {
      utterance.voice = options.voice;
    } else {
      let selectedVoice: SpeechSynthesisVoice | undefined;
      
      if (options?.lang === 'hi-IN') {
        // For Hindi: Google हिन्दी
        selectedVoice = voices.find(voice => 
          voice.lang === 'hi-IN' && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang === 'hi-IN');
      } else {
        // For English: Natural, energetic, young-sounding female voice
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Google UK English Female') || 
           voice.name.includes('Female') ||
           voice.name.includes('Samantha'))
        ) || voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Selected voice:', selectedVoice.name, selectedVoice.lang);
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