import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useToast } from '@/hooks/use-toast';

interface CrossPlatformAudioCaptureProps {
  onAudioData?: (transcript: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
}

export const CrossPlatformAudioCapture = ({
  onAudioData,
  isListening,
  onToggleListening
}: CrossPlatformAudioCaptureProps) => {
  const { isMobile, isIOS, isAndroid, isSafari } = useMobileDetection();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission with better cross-platform support
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(isIOS ? { sampleRate: 44100 } : { sampleRate: 16000 })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Choose appropriate MIME type based on platform
      let mimeType = 'audio/webm';
      if (isIOS || isSafari) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // For mobile platforms, we might need to process audio differently
        if (isMobile && onAudioData) {
          // This is a placeholder for actual audio processing
          // In production, you'd send this to a speech-to-text service
          onAudioData('Audio recorded successfully on mobile');
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: 'Recording started',
        description: `Recording on ${isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}`,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording failed',
        description: 'Please ensure microphone permissions are granted',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      toast({
        title: 'Recording stopped',
        description: 'Processing audio...',
      });
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    onToggleListening();
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isRecording ? "destructive" : "default"}
      size="lg"
      className="rounded-full p-4"
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isRecording ? (
        <MicOff className="h-6 w-6" />
      ) : (
        <Mic className="h-6 w-6" />
      )}
    </Button>
  );
};