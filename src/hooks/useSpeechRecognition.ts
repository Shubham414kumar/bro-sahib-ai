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
      console.log('Speech recognition started');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      // Auto-restart if it ended unexpectedly
      if (isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Auto-restart failed:', e);
          }
        }, 100);
      }
    };

    recognition.onresult = (event) => {
      console.log('Speech recognition result received:', event);
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
      console.log('Full transcript:', fullTranscript);
      setTranscript(fullTranscript);

      if (onResult && fullTranscript.trim()) {
        console.log('Calling onResult with:', fullTranscript);
        onResult({
          transcript: fullTranscript,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
          isFinal: event.results[event.results.length - 1]?.isFinal || false
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected, continuing...');
          // Don't stop listening for no-speech errors
          break;
        case 'network':
          console.error('Network error in speech recognition');
          setIsListening(false);
          break;
        case 'not-allowed':
          console.error('Microphone permission denied');
          setIsListening(false);
          break;
        case 'aborted':
          console.log('Speech recognition aborted');
          break;
        default:
          console.error('Unknown speech recognition error:', event.error);
          // Try to restart for other errors
          if (isListening) {
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
  }, [isSupported, language, onResult, isListening]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }
      
      if (recognitionRef.current) {
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
          } catch (error) {
            if (error.message && error.message.includes('already started')) {
              console.log('Recognition already started');
            } else {
              console.error('Error starting speech recognition:', error);
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error in startListening:', error);
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

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