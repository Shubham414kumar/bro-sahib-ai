import { useState, useRef, useCallback } from 'react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (
  onResult?: (result: VoiceRecognitionResult) => void,
  language = 'en-US'
): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false); // Track listening state with ref to avoid stale closure
  const onResultRef = useRef(onResult); // Keep callback fresh

  // Update refs when values change
  onResultRef.current = onResult;

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended, isListeningRef:', isListeningRef.current);
      // Auto-restart if we should still be listening
      if (isListeningRef.current) {
        console.log('🔄 Auto-restarting speech recognition...');
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Auto-restart failed:', e);
            isListeningRef.current = false;
            setIsListening(false);
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript);

      if (onResultRef.current && fullTranscript.trim()) {
        const confidence = event.results[event.results.length - 1]?.[0]?.confidence || 0;
        const isFinal = event.results[event.results.length - 1]?.isFinal || false;
        
        // Only process final results
        if (isFinal) {
          console.log('✅ Final transcript:', fullTranscript, 'confidence:', confidence);
          onResultRef.current({
            transcript: fullTranscript,
            confidence,
            isFinal
          });
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          // Don't stop for no-speech, just wait for more input
          break;
        case 'network':
          console.error('Network error in speech recognition');
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case 'not-allowed':
          console.error('Microphone permission denied');
          isListeningRef.current = false;
          setIsListening(false);
          break;
        case 'aborted':
          console.log('Speech recognition aborted');
          break;
        default:
          // Try to restart for other errors if we should be listening
          if (isListeningRef.current) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                console.log('Restart after error failed:', e);
              }
            }, 500);
          }
      }
    };

    return recognition;
  }, [isSupported, language]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // Create new recognition instance if needed
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }
      
      if (recognitionRef.current) {
        isListeningRef.current = true;
        setIsListening(true);
        
        // Stop any existing instance first
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        
        // Small delay before starting
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            console.log('🎤 Recognition started successfully');
          } catch (error: any) {
            if (error.message?.includes('already started')) {
              console.log('Recognition already started');
            } else {
              console.error('Error starting speech recognition:', error);
              isListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error in startListening:', error);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    console.log('🛑 Stopping speech recognition');
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};