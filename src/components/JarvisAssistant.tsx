import { useState, useEffect, useCallback } from 'react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { ChatHistory } from './ChatHistory';
import { ControlPanel } from './ControlPanel';
import { PaymentPlans } from './PaymentPlans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import { MemoryService } from '@/services/MemoryService';
import { SearchService } from '@/services/SearchService';
import { SystemService } from '@/services/SystemService';
import { ReminderService } from '@/services/ReminderService';
import { SecurityService } from '@/services/SecurityService';

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
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState('assistant');
  const { toast } = useToast();

  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  // Initialize services on mount
  useEffect(() => {
    ReminderService.requestNotificationPermission();
  }, []);

  const handleSpeechResult = useCallback((result: any) => {
    console.log('Speech result received:', result);
    if (result.isFinal) {
      const transcript = result.transcript.toLowerCase().trim();
      console.log('Processing transcript:', transcript);
      console.log('🎤 Speech Result:', transcript);
      console.log('🤖 Is Active:', isActive);
      
      // Check for wake phrase
      if (!isActive && WAKE_PHRASES.some(phrase => transcript.includes(phrase))) {
        console.log('🚀 Wake phrase detected!');
        setIsActive(true);
        const hinglishGreeting = Math.random() > 0.5 
          ? 'Hello bro! JARVIS active ho gaya hai. Kya kaam hai?'
          : 'Hey! JARVIS is now active. How can I help you?';
        speak(hinglishGreeting);
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: hinglishGreeting,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        return;
      }

      // Process commands when active
      if (isActive && transcript) {
        console.log('✅ Processing command since JARVIS is active');
        
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

  const { isListening, startListening, stopListening, isSupported: speechSupported } = useSpeechRecognition(
    handleSpeechResult,
    'hi-IN'
  );

  const processCommand = async (command: string) => {
    console.log('Processing command:', command);
    let response = '';
    const lowerCommand = command.toLowerCase();

    // Enhanced command processing with Hinglish support
    if (lowerCommand.includes('time') || lowerCommand.includes('samay') || lowerCommand.includes('btao') || lowerCommand.includes('bata')) {
      const now = new Date();
      const hinglishTime = Math.random() > 0.5 
        ? `Abhi time hai ${now.toLocaleTimeString()}`
        : `The current time is ${now.toLocaleTimeString()}`;
      response = hinglishTime;
    } 
    else if (lowerCommand.includes('date') || lowerCommand.includes('tarikh') || lowerCommand.includes('din')) {
      const today = new Date();
      const hinglishDate = Math.random() > 0.5 
        ? `Aaj ka date hai ${today.toLocaleDateString()}`
        : `Today is ${today.toLocaleDateString()}`;
      response = hinglishDate;
    }
    // Memory commands
    else if (lowerCommand.includes('naam yaad rakho') || lowerCommand.includes('remember my name')) {
      const nameMatch = command.match(/naam\s+(.+?)\s+yaad\s+rakho|my\s+name\s+is\s+(.+)/i);
      if (nameMatch) {
        const name = nameMatch[1] || nameMatch[2];
        await MemoryService.saveMemory('user_name', name);
        response = `Theek hai bro, main yaad rakh lunga ki aapka naam ${name} hai.`;
      } else {
        response = 'Bataiye aapka naam kya hai? Boliye "mera naam [your name] yaad rakho"';
      }
    }
    else if (lowerCommand.includes('mera naam kya hai') || lowerCommand.includes('what is my name')) {
      const name = await MemoryService.getMemory('user_name');
      response = name 
        ? `Aapka naam ${name} hai, yaad hai mujhe!`
        : 'Sorry bro, mujhe aapka naam yaad nahi hai. Pehle bataiye "mera naam [your name] yaad rakho"';
    }
    // Web search
    else if (lowerCommand.includes('search') || lowerCommand.includes('google') || lowerCommand.includes('khojo')) {
      const searchMatch = command.match(/search\s+(.+)|google\s+(.+)|khojo\s+(.+)/i);
      if (searchMatch) {
        const query = searchMatch[1] || searchMatch[2] || searchMatch[3];
        response = 'Searching kar raha hun... wait karo';
        
        // Add immediate response
        const searchingMessage: ChatMessage = {
          id: Date.now().toString(),
          text: response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, searchingMessage]);
        
        if (!isMuted) speak(response);
        
        try {
          // Perform search
          const searchResult = await SearchService.searchWeb(query);
          response = `Search result: ${searchResult}`;
        } catch (error) {
          console.error('Search error:', error);
          response = `Sorry bro, search mein problem aa rahi hai. Try karo: "time batao" ya "mera naam kya hai"`;
        }
      } else {
        response = 'Kya search karna hai? Boliye "search [your query]"';
      }
    }
    // System commands
    else if (lowerCommand.includes('open') || lowerCommand.includes('kholo')) {
      response = SystemService.executeCommand(command);
    }
    // Reminders
    else if (lowerCommand.includes('remind me') || lowerCommand.includes('yaad dilana')) {
      const reminderMatch = command.match(/remind\s+me\s+(.+?)\s+in\s+(\d+)\s+minute|yaad\s+dilana\s+(.+?)\s+(\d+)\s+minute/i);
      if (reminderMatch) {
        const text = reminderMatch[1] || reminderMatch[3];
        const minutes = parseInt(reminderMatch[2] || reminderMatch[4]);
        response = await ReminderService.setReminder(text, minutes);
      } else {
        response = 'Reminder kaise set karu? Boliye "remind me [task] in [number] minutes"';
      }
    }
    // Feature activation with Hinglish
    else if (lowerCommand.includes('email')) {
      response = Math.random() > 0.5 
        ? 'Email feature activate ho gaya hai. Main aapke emails read aur compose kar sakta hun.'
        : 'Email feature activated. I can help you read and compose emails.';
      if (!activeFeatures.includes('email')) {
        setActiveFeatures(prev => [...prev, 'email']);
      }
    }
    else if (lowerCommand.includes('youtube') || lowerCommand.includes('music') || lowerCommand.includes('gaana')) {
      response = Math.random() > 0.5 
        ? 'YouTube aur music control active hai. Gaane play kar sakta hun.'
        : 'YouTube and music control is now active. You can ask me to play songs.';
      if (!activeFeatures.includes('youtube')) {
        setActiveFeatures(prev => [...prev, 'youtube']);
      }
    }
    else if (lowerCommand.includes('screen') || lowerCommand.includes('automation')) {
      response = 'Screen automation feature ready hai. Screen tasks automate kar sakta hun.';
      if (!activeFeatures.includes('screen')) {
        setActiveFeatures(prev => [...prev, 'screen']);
      }
    }
    else if (lowerCommand.includes('study') || lowerCommand.includes('padhai')) {
      response = Math.random() > 0.5 
        ? 'Study helper mode activate! Padhai mein help kar sakta hun.'
        : 'Study helper mode activated. I can assist with learning and research.';
      if (!activeFeatures.includes('study')) {
        setActiveFeatures(prev => [...prev, 'study']);
      }
    }
    else if (lowerCommand.includes('face') || lowerCommand.includes('recognition')) {
      response = 'Face recognition system ready hai. Camera access chahiye hoga.';
      if (!activeFeatures.includes('face')) {
        setActiveFeatures(prev => [...prev, 'face']);
      }
    }
    else if (lowerCommand.includes('app') || lowerCommand.includes('application')) {
      response = Math.random() > 0.5 
        ? 'App control activate ho gaya. Applications manage kar sakta hun.'
        : 'App control is now active. I can help manage applications.';
      if (!activeFeatures.includes('apps')) {
        setActiveFeatures(prev => [...prev, 'apps']);
      }
    }
    else if (lowerCommand.includes('goodbye') || lowerCommand.includes('bye') || lowerCommand.includes('sleep') || lowerCommand.includes('alvida')) {
      response = Math.random() > 0.5 
        ? 'Theek hai bro, main sleep mode mein ja raha hun. "Hey Bro" bolke wapas jagana.'
        : 'JARVIS going to sleep mode. Say "Hey Bro" to wake me up again.';
      setIsActive(false);
    }
    else if (lowerCommand.includes('mute') || lowerCommand.includes('chup')) {
      setIsMuted(true);
      response = 'Audio mute kar diya hai.';
    }
    else if (lowerCommand.includes('unmute') || lowerCommand.includes('bol')) {
      setIsMuted(false);
      response = 'Audio restore ho gaya hai.';
    }
    else {
      // Enhanced default response with Hinglish - for ANY command that doesn't match
      console.log('No specific command matched, giving default response');
      const hinglishResponses = [
        `"${command}" - ye samjha nahi bro. Main ye kar sakta hun: time, date, search, reminders, email, YouTube control. Kya chahiye?`,
        `Mai sun raha hun "${command}". Kuch aur batao - search, time, date, ya koi specific task?`,
        `"${command}" ka matlab samjha nahi. Try karo: "time batao", "search weather", "remind me in 5 minutes"`,
        `Hello bro! "${command}" samjha nahi. Time, date, search, reminders - ye sab kar sakta hun. Kya chahiye?`,
        `Bro, "${command}" clear nahi hai. Main active hun - time batao, search karo, ya reminder set karo!`
      ];
      response = hinglishResponses[Math.floor(Math.random() * hinglishResponses.length)];
    }

    console.log('Generated response:', response);

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
      console.log('Speaking response:', response);
      speak(response);
    } else {
      console.log('Not speaking - muted:', isMuted, 'response:', !!response);
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

  // Set API key on mount
  useEffect(() => {
    const defaultApiKey = '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';
    setApiKey(defaultApiKey);
    SearchService.setApiKey(defaultApiKey);
  }, []);

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
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent mb-4">
            JARVIS
          </h1>
          <p className="text-muted-foreground text-lg">
            {isActive ? 'Active - Sun raha hun' : 'Standby Mode - Say "Hey Bro" to activate'}
          </p>
          <p className="text-xs text-jarvis-blue-light mt-2">
            Features: Voice I/O • System Commands • Web Search • Memory • Reminders • Hinglish Support
          </p>
        </div>

        {/* Tabs for Assistant and Premium Plans */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="premium">Premium Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assistant" className="flex flex-col items-center space-y-8">
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
                <div>
                  <p className="text-jarvis-blue text-xl mb-2">
                    Say "Hey Bro" to activate JARVIS
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try: "search something" • "open notepad" • "remind me in 5 minutes" • "mera naam yaad rakho"
                  </p>
                </div>
              ) : (
                <p className="text-jarvis-blue-light text-lg">
                  {isListening ? 'Listening... (Hinglish supported)' : 'Click the mic to speak'}
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
          </TabsContent>
          
          <TabsContent value="premium" className="flex justify-center">
            <PaymentPlans user={{ name: 'User', email: 'user@example.com' }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
