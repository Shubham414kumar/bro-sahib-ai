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

    // Stop any current speech first
    speechSynthesis.cancel();

    // Small delay to ensure previous speech is fully stopped
    setTimeout(() => {
      // Add natural pauses for better flow
      const processedText = text
        .replace(/\.\.\./g, '... ')
        .replace(/([.!?])\s+/g, '$1 ')
        .replace(/,/g, ', ');

      const utterance = new SpeechSynthesisUtterance(processedText);
      
      const lang = options?.lang || 'en-US';
      const isHindi = lang === 'hi-IN';
      
      // Adjust settings based on language
      utterance.rate = options?.rate || (isHindi ? 0.85 : 1.0); // Slower for Hindi clarity
      utterance.pitch = options?.pitch || (isHindi ? 1.0 : 1.1); // Natural pitch
      utterance.volume = options?.volume || 1;
      utterance.lang = lang;

      // Find appropriate voice based on language
      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        let selectedVoice: SpeechSynthesisVoice | undefined;
        
        if (isHindi) {
          // For Hindi: Prefer high-quality Hindi voices
          selectedVoice = 
            // Priority 1: Google Hindi Female
            voices.find(voice => 
              voice.lang === 'hi-IN' && voice.name.includes('Google') && voice.name.toLowerCase().includes('female')
            ) ||
            // Priority 2: Any Google Hindi voice
            voices.find(voice => 
              voice.lang === 'hi-IN' && voice.name.includes('Google')
            ) ||
            // Priority 3: Microsoft Hindi voices (Swara is good)
            voices.find(voice => 
              voice.lang === 'hi-IN' && (voice.name.includes('Swara') || voice.name.includes('Microsoft'))
            ) ||
            // Priority 4: Lekha (Apple Hindi)
            voices.find(voice => 
              voice.lang === 'hi-IN' && voice.name.includes('Lekha')
            ) ||
            // Priority 5: Any Hindi voice
            voices.find(voice => voice.lang === 'hi-IN') ||
            // Fallback: Hindi-like voice
            voices.find(voice => voice.lang.startsWith('hi'));
            
          console.log('🎤 Hindi voice selection, available:', voices.filter(v => v.lang.includes('hi')).map(v => v.name));
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
        } else {
          console.log('⚠️ No suitable voice found for language:', lang);
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    }, 50); // Small delay to prevent overlap
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