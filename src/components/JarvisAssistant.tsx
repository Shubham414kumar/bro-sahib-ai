import { useState, useEffect, useCallback } from 'react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { ChatHistory } from './ChatHistory';
import { ControlPanel } from './ControlPanel';
import { PaymentPlans } from './PaymentPlans';
import { LiveTranscript } from './LiveTranscript';
import { SystemCommandPanel } from './SystemCommandPanel';
import { PremiumGate } from './PremiumGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import { MemoryService } from '@/services/MemoryService';
import { SearchService } from '@/services/SearchService';
import { AdvancedSystemService } from '@/services/AdvancedSystemService';
import { ReminderService } from '@/services/ReminderService';
import { SecurityService } from '@/services/SecurityService';
import PlanService, { UserTier } from '@/services/PlanService';
import { Button } from './ui/button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Crown } from 'lucide-react';

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
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const { toast } = useToast();

  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  // Initialize services on mount
  useEffect(() => {
    ReminderService.requestNotificationPermission();
    // Load user tier on component mount
    PlanService.getUserTier().then(setUserTier);
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
    // Advanced System commands with tier checking
    else if (lowerCommand.includes('open') || lowerCommand.includes('kholo') || 
             lowerCommand.includes('play') || lowerCommand.includes('youtube') ||
             lowerCommand.includes('calculate') || lowerCommand.includes('whatsapp') ||
             lowerCommand.includes('map') || lowerCommand.includes('navigate') ||
             lowerCommand.includes('email') || lowerCommand.includes('gmail') ||
             lowerCommand.includes('amazon') || lowerCommand.includes('weather') ||
             lowerCommand.includes('news') || lowerCommand.includes('battery') ||
             lowerCommand.includes('network') || lowerCommand.includes('timer') ||
             lowerCommand.includes('translate') || lowerCommand.includes('screenshot')) {
      
      // Check feature availability based on user tier
      const commandFeatureMap: Record<string, string> = {
        'youtube': userTier === 'basic' ? 'youtube_basic' : 'youtube_full',
        'calculator': 'calculator',
        'browser': 'browser',
        'chrome': 'browser',
        'gmail': 'gmail',
        'email': 'gmail',
        'whatsapp': userTier === 'premium' ? 'whatsapp_messaging' : 'whatsapp_open',
        'maps': 'maps',
        'map': 'maps',
        'navigate': 'maps',
        'screen': 'screen_automation',
        'face': 'face_recognition',
        'study': 'study_assistant',
      };

      // Find which feature this command needs
      let requiredFeature = '';
      for (const [keyword, feature] of Object.entries(commandFeatureMap)) {
        if (lowerCommand.includes(keyword)) {
          requiredFeature = feature;
          break;
        }
      }

      // Check if user has access to this feature
      if (requiredFeature && !PlanService.isFeatureAvailable(requiredFeature)) {
        response = userTier === 'free' 
          ? "Ye feature premium hai bro. Crown icon pe click karke plan choose karo."
          : "Is feature ke liye aapko upgrade karna padega. Crown icon pe click karo.";
        setShowPremiumGate(true);
      } else {
        response = AdvancedSystemService.executeCommand(command);
      }
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

  const handleSystemCommand = (command: string) => {
    if (isActive) {
      processCommand(command);
    } else {
      toast({
        title: 'JARVIS is not active',
        description: 'Say "Hey Bro" to activate JARVIS first'
      });
    }
  };

  // Initialize services
  useEffect(() => {
    // API key is now handled by edge function
    console.log('DeepSeek API is now configured through edge function');
  }, []);

  // Auto-start listening when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once on mount


  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark">
      {/* Premium Gate Modal */}
      <PremiumGate isOpen={showPremiumGate} onClose={() => setShowPremiumGate(false)} />
      
      {/* Header */}
      <div className="h-16 bg-background/50 backdrop-blur-sm border-b border-jarvis-blue/20 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-jarvis-blue hover:bg-jarvis-blue/10"
        >
          {leftPanelOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
              JARVIS AI ASSISTANT
            </h1>
            {userTier !== 'free' && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                userTier === 'basic' ? 'bg-blue-500' :
                userTier === 'standard' ? 'bg-purple-500' :
                'bg-gradient-to-r from-yellow-500 to-orange-500'
              } text-white`}>
                {userTier.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isActive ? '🟢 Active - Sun raha hun' : '⚪ Standby - Say "Hey Bro" to activate'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPremiumGate(true)}
            className="text-yellow-500 hover:bg-yellow-500/10"
            title="Premium Plans"
          >
            <Crown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10"
          >
            {rightPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Left Panel - Live Transcript */}
        <div className={`transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="h-full p-4">
            <LiveTranscript 
              entries={messages}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
            />
          </div>
        </div>

        {/* Center - Main Interface */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-auto mt-4 bg-background/50 border border-jarvis-blue/20">
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assistant" className="flex-1 flex flex-col items-center justify-center space-y-6 p-4">
              {/* Voice Visualizer */}
              <div className="jarvis-fade-in">
                <VoiceVisualizer 
                  isListening={isListening} 
                  isSpeaking={isSpeaking} 
                  isActive={isActive} 
                />
              </div>

              {/* Status Message */}
              <div className="text-center jarvis-fade-in max-w-2xl">
                {!isActive ? (
                  <div>
                    <p className="text-jarvis-blue text-2xl mb-3 font-semibold">
                      Say "Hey Bro" to activate JARVIS
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available commands: YouTube • Calculator • WhatsApp • Maps • Email • Weather • Timer • Translation
                    </p>
                    <p className="text-xs text-jarvis-blue-light mt-2">
                      Try: "play YouTube video" • "calculate 100 + 200" • "open WhatsApp" • "check weather"
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-jarvis-blue-light text-xl animate-pulse">
                      {isListening ? '🎤 Listening... (Hinglish supported)' : '🔊 Click the mic to speak'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Command Examples: "YouTube pe Arijit Singh" • "Calculate karo 50 * 3" • "Weather check karo Delhi"
                    </p>
                  </div>
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

              {/* Chat History - Compact View */}
              <div className="jarvis-fade-in w-full max-w-3xl">
                <Card className="bg-card/30 backdrop-blur-sm border-jarvis-blue/20 max-h-48 overflow-y-auto">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-2">
                      {messages.slice(-3).map((msg) => (
                        <div key={msg.id} className={`text-sm ${msg.isUser ? 'text-primary' : 'text-jarvis-blue'}`}>
                          <span className="font-medium">{msg.isUser ? 'You: ' : 'JARVIS: '}</span>
                          {msg.text}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - System Commands */}
        <div className={`transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <div className="h-full p-4">
            <SystemCommandPanel onCommandClick={handleSystemCommand} />
          </div>
        </div>
      </div>
    </div>
  );
};
