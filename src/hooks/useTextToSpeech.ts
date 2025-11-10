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

    // Add natural pauses for better flow
    const processedText = text
      .replace(/\.\.\./g, '... ')
      .replace(/([.!?])\s+/g, '$1 ')
      .replace(/,/g, ', ');

    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Dynamic rate based on content length for natural flow
    const wordCount = text.split(' ').length;
    let dynamicRate = 1.0;
    if (wordCount < 10) {
      dynamicRate = 0.95; // Slower for short responses
    } else if (wordCount > 50) {
      dynamicRate = 1.05; // Slightly faster for long responses
    }
    
    // Enhanced voice settings for natural, lively tone
    utterance.rate = options?.rate || dynamicRate;
    utterance.pitch = options?.pitch || 1.15; // Natural feminine pitch
    utterance.volume = options?.volume || 1;
    utterance.lang = options?.lang || 'en-US';

    // Find appropriate voice based on language
    if (options?.voice) {
      utterance.voice = options.voice;
    } else {
      let selectedVoice: SpeechSynthesisVoice | undefined;
      
      if (options?.lang === 'hi-IN') {
        // For Hindi: Prefer Google Hindi voices
        selectedVoice = voices.find(voice => 
          voice.lang === 'hi-IN' && voice.name.includes('Google')
        ) || voices.find(voice => 
          voice.lang === 'hi-IN' && (voice.name.includes('Female') || voice.name.includes('Lekha'))
        ) || voices.find(voice => voice.lang === 'hi-IN');
      } else {
        // Enhanced female voice selection for English with priority order
        selectedVoice = 
          // Priority 1: Natural female voices (Samantha is best on Apple devices)
          voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Samantha')
          ) ||
          // Priority 2: Other high-quality female voices
          voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Victoria') || voice.name.includes('Karen') || voice.name.includes('Zira'))
          ) ||
          // Priority 3: Google female voices
          voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Google') && voice.name.includes('Female')
          ) ||
          // Priority 4: Any female voice
          voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
          ) ||
          // Priority 5: Any Google English voice
          voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Google')
          ) ||
          // Fallback: Any English voice
          voices.find(voice => voice.lang.startsWith('en'));
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