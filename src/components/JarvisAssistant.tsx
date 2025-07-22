import { useState, useEffect, useCallback } from 'react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { ChatHistory } from './ChatHistory';
import { ControlPanel } from './ControlPanel';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

const WAKE_PHRASES = ['hey bro', 'hai bro', 'हे ब्रो', 'हाय ब्रो'];

export const JarvisAssistant = () => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeFeatures, setActiveFeatures] = useState<string[]>(['email', 'youtube']);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  const handleSpeechResult = useCallback((result: any) => {
    if (result.isFinal) {
      const transcript = result.transcript.toLowerCase().trim();
      
      // Check for wake phrase
      if (!isActive && WAKE_PHRASES.some(phrase => transcript.includes(phrase))) {
        setIsActive(true);
        speak('Hello! JARVIS is now active. How can I help you?');
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: 'JARVIS is now active. How can I help you?',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        return;
      }

      // Process commands when active
      if (isActive && transcript) {
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          text: transcript,
          isUser: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Process the command
        processCommand(transcript);
      }
    }
  }, [isActive]); // Removed speak and processCommand from dependencies to prevent re-renders

  const { isListening, startListening, stopListening } = useSpeechRecognition(
    handleSpeechResult,
    'en-US'
  );

  const processCommand = (command: string) => {
    let response = '';

    // Command processing logic
    if (command.includes('time')) {
      const now = new Date();
      response = `The current time is ${now.toLocaleTimeString()}`;
    } else if (command.includes('date')) {
      const today = new Date();
      response = `Today is ${today.toLocaleDateString()}`;
    } else if (command.includes('email')) {
      response = 'Email feature activated. I can help you read and compose emails.';
      if (!activeFeatures.includes('email')) {
        setActiveFeatures(prev => [...prev, 'email']);
      }
    } else if (command.includes('youtube') || command.includes('music')) {
      response = 'YouTube and music control is now active. You can ask me to play songs or control playback.';
      if (!activeFeatures.includes('youtube')) {
        setActiveFeatures(prev => [...prev, 'youtube']);
      }
    } else if (command.includes('screen') || command.includes('automation')) {
      response = 'Screen automation feature is ready. I can help you automate screen tasks.';
      if (!activeFeatures.includes('screen')) {
        setActiveFeatures(prev => [...prev, 'screen']);
      }
    } else if (command.includes('study') || command.includes('learn')) {
      response = 'Study helper mode is activated. I can assist you with learning and research.';
      if (!activeFeatures.includes('study')) {
        setActiveFeatures(prev => [...prev, 'study']);
      }
    } else if (command.includes('face') || command.includes('recognition')) {
      response = 'Face recognition system is ready. Note: Camera access may be required.';
      if (!activeFeatures.includes('face')) {
        setActiveFeatures(prev => [...prev, 'face']);
      }
    } else if (command.includes('app') || command.includes('application')) {
      response = 'App control is now active. I can help you manage and control applications.';
      if (!activeFeatures.includes('apps')) {
        setActiveFeatures(prev => [...prev, 'apps']);
      }
    } else if (command.includes('goodbye') || command.includes('bye') || command.includes('sleep')) {
      response = 'JARVIS going to sleep mode. Say "Hey Bro" to wake me up again.';
      setIsActive(false);
    } else if (command.includes('mute') || command.includes('quiet')) {
      setIsMuted(true);
      response = 'Audio output muted.';
    } else if (command.includes('unmute') || command.includes('speak')) {
      setIsMuted(false);
      response = 'Audio output restored.';
    } else {
      // Default AI response
      response = `I heard you say "${command}". I'm a prototype AI assistant. I can help with email, YouTube control, screen automation, study assistance, face recognition, and app control. What would you like me to do?`;
    }

    // Add AI response to chat
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      text: response,
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);

    // Speak response if not muted
    if (!isMuted && response) {
      speak(response);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopSpeaking();
    }
    toast({
      title: isMuted ? 'Audio Enabled' : 'Audio Muted',
      description: isMuted ? 'JARVIS can speak again' : 'JARVIS audio output disabled'
    });
  };

  const handleFeatureClick = (feature: string) => {
    if (activeFeatures.includes(feature)) {
      setActiveFeatures(prev => prev.filter(f => f !== feature));
      toast({
        title: 'Feature Disabled',
        description: `${feature} feature has been disabled`
      });
    } else {
      setActiveFeatures(prev => [...prev, feature]);
      toast({
        title: 'Feature Enabled',
        description: `${feature} feature is now active`
      });
    }
  };

  // Auto-start listening when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 jarvis-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent mb-2">
            JARVIS
          </h1>
          <p className="text-muted-foreground text-lg">
            AI Voice Assistant - {isActive ? 'Active' : 'Standby Mode'}
          </p>
        </div>

        {/* Main Interface */}
        <div className="flex flex-col items-center space-y-8">
          {/* Voice Visualizer */}
          <div className="jarvis-fade-in">
            <VoiceVisualizer 
              isListening={isListening} 
              isSpeaking={isSpeaking} 
              isActive={isActive} 
            />
          </div>

          {/* Status Message */}
          <div className="text-center jarvis-fade-in">
            {!isActive ? (
              <p className="text-jarvis-blue text-xl">
                Say "Hey Bro" to activate JARVIS
              </p>
            ) : (
              <p className="text-jarvis-blue-light text-lg">
                {isListening ? 'Listening...' : 'Click the mic to speak'}
              </p>
            )}
          </div>

          {/* Control Panel */}
          <div className="jarvis-fade-in">
            <ControlPanel
              isListening={isListening}
              isMuted={isMuted}
              isOnline={true}
              activeFeatures={activeFeatures}
              onToggleListening={handleToggleListening}
              onToggleMute={handleToggleMute}
              onFeatureClick={handleFeatureClick}
            />
          </div>

          {/* Chat History */}
          <div className="jarvis-fade-in">
            <ChatHistory messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
};