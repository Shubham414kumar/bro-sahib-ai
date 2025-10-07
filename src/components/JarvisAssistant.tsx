import { useState, useEffect, useCallback } from 'react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { ChatHistory } from './ChatHistory';
import { ControlPanel } from './ControlPanel';
import { PaymentPlans } from './PaymentPlans';
import { LiveTranscript } from './LiveTranscript';
import { SystemCommandPanel } from './SystemCommandPanel';
import { SystemStatusPanel } from './SystemStatusPanel';
import { PremiumGate } from './PremiumGate';
import { UserProfile } from './UserProfile';
import { FaceRecognition } from './FaceRecognition';
import { JarvisLogo } from './JarvisLogo';
import { CrossPlatformAudioCapture } from './CrossPlatformAudioCapture';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { MemoryService } from '@/services/MemoryService';
import { SearchService } from '@/services/SearchService';
import { AdvancedSystemService } from '@/services/AdvancedSystemService';
import { ReminderService } from '@/services/ReminderService';
import { SecurityService } from '@/services/SecurityService';
import PlanService, { UserTier } from '@/services/PlanService';
import { Button } from './ui/button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Crown, UserCircle, Menu } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

interface JarvisAssistantProps {
  onActiveChange?: (isActive: boolean) => void;
}

const WAKE_PHRASES = ['hey bro', 'hai bro', 'हे ब्रो', 'हाय ब्रो'];

export const JarvisAssistant = ({ onActiveChange }: JarvisAssistantProps) => {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load messages from localStorage on mount
    const saved = localStorage.getItem('jarvis-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error('Failed to load messages:', e);
        return [];
      }
    }
    return [];
  });
  const [activeFeatures, setActiveFeatures] = useState<string[]>(['email', 'youtube']);
  const [isMuted, setIsMuted] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState('assistant');
  const [leftPanelOpen, setLeftPanelOpen] = useState(false); // Start closed on mobile
  const [rightPanelOpen, setRightPanelOpen] = useState(false); // Start closed on mobile
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isMobile, isIOS, isAndroid } = useMobileDetection();

  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('jarvis-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize services on mount
  useEffect(() => {
    ReminderService.requestNotificationPermission();
    // Load user tier on component mount
    PlanService.getUserTier().then(setUserTier);
  }, []);

  const handleSpeechResult = useCallback((result: any) => {
    console.log('🎤 Speech result received:', result);
    if (result.isFinal) {
      const transcript = result.transcript.toLowerCase().trim();
      console.log('📝 Processing transcript:', transcript);
      console.log('🤖 Is Active:', isActive);
      
      // Always process commands when transcript is received and listening
      if (transcript) {
        console.log('✅ Processing command:', transcript);
        
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
  }, [isActive]);

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
    // Advanced System commands with tier checking and auto-execution
    else if (lowerCommand.includes('open') || lowerCommand.includes('kholo') || 
             lowerCommand.includes('play') || lowerCommand.includes('youtube') ||
             lowerCommand.includes('calculate') || lowerCommand.includes('whatsapp') ||
             lowerCommand.includes('map') || lowerCommand.includes('navigate') ||
             lowerCommand.includes('email') || lowerCommand.includes('gmail') ||
             lowerCommand.includes('amazon') || lowerCommand.includes('weather') ||
             lowerCommand.includes('news') || lowerCommand.includes('battery') ||
             lowerCommand.includes('network') || lowerCommand.includes('timer') ||
             lowerCommand.includes('translate') || lowerCommand.includes('screenshot') ||
             lowerCommand.includes('call') || lowerCommand.includes('phone')) {
      
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
        'call': userTier === 'premium' ? 'call_features' : '',
        'phone': userTier === 'premium' ? 'call_features' : '',
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
        // Auto-execute the command
        response = AdvancedSystemService.executeCommand(command);
        
        // Special handling for YouTube music playback
        if (lowerCommand.includes('play') && (lowerCommand.includes('music') || lowerCommand.includes('song') || lowerCommand.includes('gaana'))) {
          const songMatch = command.match(/play\s+(.+?)(?:\s+music|\s+song|\s+gaana|$)/i);
          if (songMatch) {
            const songName = songMatch[1].replace(/music|song|gaana/gi, '').trim();
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(songName + ' song')}`, '_blank');
            response = `YouTube pe "${songName}" play kar raha hun... Pehla result automatically play hoga.`;
          }
        }
        
        // Special handling for calculator with direct calculation
        if (lowerCommand.includes('calculate') || lowerCommand.includes('add') || lowerCommand.includes('subtract') || lowerCommand.includes('multiply') || lowerCommand.includes('divide')) {
          const calcMatch = command.match(/(\d+(?:\.\d+)?)\s*([+\-*/]|\s+(?:plus|add|minus|subtract|multiply|divide|times))\s*(\d+(?:\.\d+)?)/gi);
          if (calcMatch) {
            try {
              // Extract numbers and operation
              const expression = command.replace(/plus|add/gi, '+')
                                     .replace(/minus|subtract/gi, '-')
                                     .replace(/multiply|times/gi, '*')
                                     .replace(/divide|by/gi, '/')
                                     .match(/[\d+\-*/.\s]+/);
              if (expression) {
                const result = Function('"use strict"; return (' + expression[0].replace(/[^0-9+\-*/().\s]/g, '') + ')')();
                response = `Calculation ka result hai: ${result}`;
              }
            } catch (error) {
              response = 'Calculation mein error aaya. Try again with proper numbers.';
            }
          }
        }
        
        // Auto-handle call features for premium users
        if ((lowerCommand.includes('call') || lowerCommand.includes('phone')) && userTier === 'premium') {
          const numberMatch = command.match(/(\d{10})/);
          if (numberMatch) {
            window.open(`tel:${numberMatch[1]}`, '_blank');
            response = `Calling ${numberMatch[1]}... Phone app open ho raha hai.`;
          } else {
            response = 'Phone number batao call karne ke liye. Example: "call 9876543210"';
          }
        }
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

    // Speak response if not muted and voice enabled
    const voiceEnabled = localStorage.getItem('jarvis-voice-enabled') !== 'false';
    if (!isMuted && response && voiceEnabled) {
      console.log('Speaking response:', response);
      speak(response);
    } else {
      console.log('Not speaking - muted:', isMuted, 'voiceEnabled:', voiceEnabled, 'response:', !!response);
    }
  };

  const handleToggleListening = () => {
    console.log('🎯 Toggle Listening clicked');
    console.log('Current state - isListening:', isListening, 'isActive:', isActive);
    
    if (isActive) {
      stopListening();
      stopSpeaking();
      setIsActive(false);
      onActiveChange?.(false);
      const farewell = 'Goodbye! See you soon.';
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: farewell,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      speak(farewell);
      console.log('🛑 Assistant stopped');
      return;
    }
    
    if (!speechSupported && !isMobile) {
      console.log('❌ Speech not supported on this browser');
      toast({
        title: 'Microphone Not Available',
        description: 'Your browser does not support speech recognition. Please use Chrome or Edge.',
        variant: 'destructive'
      });
      return;
    }
    
    if (isListening) {
      console.log('🛑 Stopping JARVIS');
      stopListening();
      stopSpeaking();
      setIsActive(false);
      
      const goodbyeMsg = Math.random() > 0.5 
        ? 'Goodbye! See you soon, bro.' 
        : 'JARVIS signing off. Take care!';
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: goodbyeMsg,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: 'JARVIS Stopped',
        description: goodbyeMsg,
      });
    } else {
      console.log('▶️ Starting JARVIS');
      
      // Request microphone permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            startListening();
            setIsActive(true);
            
            const greeting = Math.random() > 0.5
              ? 'Hey there! I\'m online and ready to help, bro.'
              : 'JARVIS activated. How can I assist you today?';
            
            const voiceEnabled = localStorage.getItem('jarvis-voice-enabled') !== 'false';
            if (voiceEnabled) {
              speak(greeting);
            }
            
            const aiMessage: ChatMessage = {
              id: Date.now().toString(),
              text: greeting,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            
            toast({
              title: 'JARVIS Started',
              description: 'Voice assistant is now listening',
            });
          })
          .catch((error) => {
            console.error('Microphone permission denied:', error);
            toast({
              title: 'Microphone Access Denied',
              description: 'Please allow microphone access to use voice features.',
              variant: 'destructive'
            });
          });
      } else {
        startListening();
        setIsActive(true);
      }
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

  // Don't auto-start - let user control it
  useEffect(() => {
    console.log('🚀 JARVIS Assistant mounted and ready');
    console.log('Device info - Mobile:', isMobile, 'iOS:', isIOS, 'Android:', isAndroid);
    console.log('Speech supported:', speechSupported);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark">
      {/* Premium Gate Modal */}
      <PremiumGate isOpen={showPremiumGate} onClose={() => setShowPremiumGate(false)} />
      
      {/* User Profile Modal */}
      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} />
      
      {/* Header - Mobile Responsive */}
      <div className="h-14 sm:h-16 bg-background/50 backdrop-blur-sm border-b border-jarvis-blue/20 flex items-center px-2 sm:px-4">
        {/* Jarvis Logo on the left */}
        <div className="flex items-center gap-2">
          <JarvisLogo size={isMobile ? 32 : 40} className="mr-1 sm:mr-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10 hidden md:flex"
          >
            {leftPanelOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
        </div>
        
        {/* Center Title - Mobile Responsive */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
              JARVIS AI
            </h1>
            {userTier !== 'free' && (
              <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                userTier === 'basic' ? 'bg-blue-500' :
                userTier === 'standard' ? 'bg-purple-500' :
                'bg-gradient-to-r from-yellow-500 to-orange-500'
              } text-white hidden md:inline`}>
                {userTier.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {isListening 
              ? '🟢 Listening - I can hear you' 
              : isActive 
                ? '🟡 Ready - Press Start to begin'
                : '⚪ Offline - Press Start to activate'}
          </p>
        </div>
        
        {/* Right Actions - Mobile Responsive */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserProfile(true)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10 h-8 w-8 sm:h-10 sm:w-10"
            title="User Profile"
          >
            <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPremiumGate(true)}
            className="text-yellow-500 hover:bg-yellow-500/10 h-8 w-8 sm:h-10 sm:w-10"
            title="Premium Plans"
          >
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </Button>
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10 md:hidden h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10 hidden md:flex"
          >
            {rightPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 md:hidden">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-jarvis-blue/20">
              <h2 className="text-lg font-bold text-jarvis-blue">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <SystemCommandPanel onCommandClick={handleSystemCommand} />
                {userTier === 'premium' && showFaceRecognition && (
                  <FaceRecognition isActive={isActive} onFaceDetected={() => {}} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Mobile Responsive */}
      <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] flex flex-col md:flex-row">
        {/* Left Panel - Live Transcript - Hidden on mobile */}
        <div className={`transition-all duration-300 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden hidden md:block`}>
          <div className="h-full p-4">
            <Card className="h-full bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-jarvis-blue mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-background/30">
                    <p className="text-xs text-muted-foreground">Messages</p>
                    <p className="text-xl font-bold text-jarvis-blue">{messages.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/30">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-bold text-green-400">
                      {isListening ? 'Listening' : 'Standby'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Center - Main Interface - Full width on mobile */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-auto mt-4 bg-background/50 border border-jarvis-blue/20">
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
              {userTier === 'premium' && (
                <TabsTrigger value="face" onClick={() => setShowFaceRecognition(true)}>
                  Face Recognition
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="assistant" className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4 md:space-y-6 p-2 md:p-4">
              {/* Voice Visualizer or Mobile Audio Capture */}
              <div className="jarvis-fade-in w-full flex justify-center">
                {isMobile && !speechSupported ? (
                  <CrossPlatformAudioCapture
                    onAudioData={(transcript) => {
                      console.log('📱 Mobile audio transcript received:', transcript);
                      const userMessage: ChatMessage = {
                        id: Date.now().toString(),
                        text: transcript,
                        isUser: true,
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, userMessage]);
                      processCommand(transcript);
                    }}
                    isListening={isListening}
                    onToggleListening={handleToggleListening}
                  />
                ) : (
                  <VoiceVisualizer 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    isActive={isActive} 
                  />
                )}
              </div>

              {/* Status Message - Mobile Responsive */}
              <div className="text-center jarvis-fade-in max-w-2xl px-2 sm:px-4 w-full">
                {!isListening ? (
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-jarvis-blue text-base sm:text-lg md:text-2xl font-semibold">
                      Click Start to activate JARVIS
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Available: YouTube • Calculator • WhatsApp • Maps • Email • Weather
                    </p>
                    <p className="text-xs text-jarvis-blue-light mt-2 hidden sm:block">
                      Try: "play YouTube video" • "calculate 100 + 200" • "open WhatsApp"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-jarvis-blue-light text-base sm:text-lg md:text-xl animate-pulse">
                      {isActive ? '🎤 Listening... Speak now!' : '⏸️ Ready to listen'}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Examples: "YouTube pe song" • "Calculate 50 * 3" • "What time is it"
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

              {/* Chat History - Compact View - Mobile Responsive */}
              <div className="jarvis-fade-in w-full max-w-3xl px-2 md:px-0">
                <Card className="bg-card/30 backdrop-blur-sm border-jarvis-blue/20 max-h-40 sm:max-h-48 md:max-h-60 overflow-y-auto">
                  <ScrollArea className="h-full p-2 sm:p-3 md:p-4">
                    <div className="space-y-1 sm:space-y-2">
                      {messages.length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                          No messages yet. Start speaking to JARVIS!
                        </p>
                      ) : (
                        messages.slice(-5).map((msg) => (
                          <div key={msg.id} className={`text-xs sm:text-sm ${msg.isUser ? 'text-primary' : 'text-jarvis-blue'}`}>
                            <span className="font-medium">{msg.isUser ? 'You: ' : 'JARVIS: '}</span>
                            {msg.text}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* Mobile Live Transcript */}
              <div className="md:hidden w-full px-2">
                <Card className="bg-card/30 backdrop-blur-sm border-jarvis-blue/20 max-h-24 sm:max-h-32">
                  <ScrollArea className="h-full p-2">
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">
                        Status: {isListening ? '🎤 Listening' : '⏸️ Paused'} | {isSpeaking ? '🔊 Speaking' : '🔇 Silent'}
                      </p>
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>

            {/* Face Recognition Tab */}
            {userTier === 'premium' && (
              <TabsContent value="face" className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                  <FaceRecognition isActive={isActive} onFaceDetected={(data) => {
                    if (data.detected) {
                      toast({
                        title: "Face Detected",
                        description: `Confidence: ${(data.confidence * 100).toFixed(1)}%`,
                      });
                    }
                  }} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Panel - System Commands - Hidden on mobile */}
        <div className={`transition-all duration-300 ${rightPanelOpen ? 'w-80' : 'w-0'} overflow-hidden hidden md:block`}>
          <div className="h-full p-4">
            <SystemStatusPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
