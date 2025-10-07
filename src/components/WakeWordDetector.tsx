import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WakeWordDetectorProps {
  onWakeWordDetected: () => void;
  isActive: boolean;
}

const WakeWordDetector = ({ onWakeWordDetected, isActive }: WakeWordDetectorProps) => {
  const [isListening, setIsListening] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('')
        .toLowerCase();

      if (transcript.includes('jarvis') || transcript.includes('wake up') || transcript.includes('wakeup')) {
        console.log('Wake word detected:', transcript);
        onWakeWordDetected();
        toast({
          title: "JARVIS Activated",
          description: "Hello! I'm listening...",
        });
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Wake word detection error:', event.error);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onWakeWordDetected, toast]);

  const toggleWakeWord = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    if (wakeWordEnabled) {
      recognitionRef.current.stop();
      setIsListening(false);
      setWakeWordEnabled(false);
      toast({
        title: "Wake Word Disabled",
        description: "Say 'Start' button to activate JARVIS",
      });
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setWakeWordEnabled(true);
      toast({
        title: "Wake Word Enabled",
        description: "Say 'Jarvis' or 'Wake up' to activate",
      });
    }
  };

  if (isActive) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
      <Button
        onClick={toggleWakeWord}
        variant={wakeWordEnabled ? "default" : "outline"}
        size="lg"
        className="rounded-full shadow-lg"
      >
        {wakeWordEnabled ? (
          <>
            <Mic className="mr-2 h-5 w-5 animate-pulse" />
            Wake Word Active
          </>
        ) : (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            Enable Wake Word
          </>
        )}
      </Button>
    </div>
  );
};

export default WakeWordDetector;
