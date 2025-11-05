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
import { AutomationManager } from './AutomationManager';
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
import { AutomationService } from '@/services/AutomationService';
import PlanService, { UserTier } from '@/services/PlanService';
import { Button } from './ui/button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Crown, UserCircle, Menu, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [hasGreeted, setHasGreeted] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english');
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
  const [showAutomationManager, setShowAutomationManager] = useState(false);
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
    // Start automation services
    AutomationService.startAutomations();
    
    return () => {
      AutomationService.stopAutomations();
    };
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
  }, [isActive, hasGreeted]);

  const { isListening, startListening, stopListening, isSupported: speechSupported } = useSpeechRecognition(
    handleSpeechResult,
    'hi-IN'
  );

  const processCommand = async (command: string) => {
    console.log('Processing command:', command);
    let response = '';
    const lowerCommand = command.toLowerCase();

    // Check for contextual responses first
    const contextualResponse = AutomationService.getContextualResponse(command);
    if (contextualResponse) {
      response = contextualResponse;
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      if (!isMuted) speak(response);
      return;
    }

    // Time command - support Hindi/English
    if (lowerCommand.includes('time') || lowerCommand.includes('समय') || lowerCommand.includes('samay') || 
        lowerCommand.includes('टाइम') || lowerCommand.includes('बताओ')) {
      const now = new Date();
      response = `Current time is ${now.toLocaleTimeString()}`;
    } 
    // Date command - support Hindi/English  
    else if (lowerCommand.includes('date') || lowerCommand.includes('तारीख') || lowerCommand.includes('tarikh') ||
             lowerCommand.includes('डेट')) {
      const today = new Date();
      response = `Today's date is ${today.toLocaleDateString()}`;
    }
    // Notepad command - support Hindi/English
    else if (lowerCommand.includes('notepad') || lowerCommand.includes('नोटपैड') || 
             (lowerCommand.includes('open') && lowerCommand.includes('note')) ||
             (lowerCommand.includes('खोल') && lowerCommand.includes('नोट'))) {
      response = AdvancedSystemService.executeCommand('open notepad');
    }
    // Calculator command - support Hindi/English with calculations
    else if (lowerCommand.includes('calculator') || lowerCommand.includes('कैलकुलेटर') ||
             lowerCommand.includes('calc') || lowerCommand.includes('गणना') ||
             lowerCommand.includes('calculate') || lowerCommand.includes('हिसाब')) {
      // Check if there's a calculation to perform
      const calcMatch = command.match(/calculate\s+(.+)|हिसाब\s+(.+)|calc\s+(.+)/i);
      if (calcMatch) {
        const expression = (calcMatch[1] || calcMatch[2] || calcMatch[3]).trim();
        response = AdvancedSystemService.executeCommand(`calculate ${expression}`);
      } else {
        response = AdvancedSystemService.executeCommand('open calculator');
      }
    }
    // Weather - support Hindi/English with real-time search
    else if (lowerCommand.includes('weather') || lowerCommand.includes('मौसम') || 
             lowerCommand.includes('temperature') || lowerCommand.includes('तापमान')) {
      const cityMatch = command.match(/weather\s+(?:in|for|of)?\s*(.+)|मौसम\s+(.+)/i);
      const city = cityMatch ? (cityMatch[1] || cityMatch[2]).trim() : 'current location';
      
      response = 'Checking weather...';
      const searchingMsg: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, searchingMsg]);
      if (!isMuted) speak(response);
      
      try {
        const weatherInfo = await SearchService.searchWeb(`current weather in ${city}`);
        response = weatherInfo;
      } catch (error) {
        response = `Unable to fetch weather for ${city}`;
      }
    }
    // Memory commands
    else if (lowerCommand.includes('my name is') || lowerCommand.includes('naam')) {
      const nameMatch = command.match(/my\s+name\s+is\s+(.+)|naam\s+(.+)/i);
      if (nameMatch) {
        const name = (nameMatch[1] || nameMatch[2]).trim();
        await MemoryService.saveMemory('user_name', name);
        response = `I'll remember your name is ${name}`;
      }
    }
    else if (lowerCommand.includes('what is my name') || lowerCommand.includes('mera naam')) {
      const name = await MemoryService.getMemory('user_name');
      response = name 
        ? `Your name is ${name}`
        : 'I don\'t have your name saved yet';
    }
    // Web search - support Hindi/English - trigger on ANY question
    else if (lowerCommand.includes('search') || lowerCommand.includes('google') || 
             lowerCommand.includes('खोज') || lowerCommand.includes('सर्च') ||
             lowerCommand.includes('what') || lowerCommand.includes('who') || 
             lowerCommand.includes('when') || lowerCommand.includes('where') ||
             lowerCommand.includes('how') || lowerCommand.includes('why') ||
             lowerCommand.includes('क्या') || lowerCommand.includes('कौन') ||
             lowerCommand.includes('कब') || lowerCommand.includes('कहाँ') ||
             lowerCommand.includes('कैसे') || lowerCommand.includes('क्यों')) {
      
      response = 'Searching for information...';
      
      const searchingMessage: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, searchingMessage]);
      
      if (!isMuted) speak(response);
      
      try {
        const searchResult = await SearchService.searchWeb(command);
        response = searchResult;
      } catch (error) {
        console.error('Search error:', error);
        response = `I'll try my best to answer: Let me search for that...`;
        // Fallback to AI if search fails
        try {
          const { data, error: aiError } = await supabase.functions.invoke('openrouter-chat', {
            body: { 
              messages: [{ role: 'user', content: command }]
            }
          });
          if (!aiError && data.message) {
            response = data.message;
          }
        } catch {}
      }
    }
    // YouTube - support Hindi/English with search
    else if (lowerCommand.includes('youtube') || lowerCommand.includes('यूट्यूब') ||
             lowerCommand.includes('video') || lowerCommand.includes('वीडियो') ||
             lowerCommand.includes('play') || lowerCommand.includes('चलाओ') ||
             lowerCommand.includes('गाना') || lowerCommand.includes('song')) {
      const searchMatch = command.match(/play\s+(.+)|youtube\s+(.+)|video\s+(.+)|गाना\s+(.+)|song\s+(.+)/i);
      if (searchMatch) {
        const query = (searchMatch[1] || searchMatch[2] || searchMatch[3] || searchMatch[4] || searchMatch[5]).trim();
        response = AdvancedSystemService.executeCommand(`play youtube ${query}`);
      } else {
        response = AdvancedSystemService.executeCommand('open youtube');
      }
    }
    // Email - support Hindi/English
    else if (lowerCommand.includes('email') || lowerCommand.includes('ईमेल') ||
             lowerCommand.includes('gmail') || lowerCommand.includes('जीमेल') ||
             lowerCommand.includes('mail')) {
      response = AdvancedSystemService.executeCommand('open email');
    }
    // WhatsApp - support Hindi/English
    else if (lowerCommand.includes('whatsapp') || lowerCommand.includes('व्हाट्सएप')) {
      response = AdvancedSystemService.executeCommand('open whatsapp');
    }
    // Maps - support Hindi/English
    else if (lowerCommand.includes('map') || lowerCommand.includes('मैप') ||
             lowerCommand.includes('navigate') || lowerCommand.includes('location') ||
             lowerCommand.includes('direction') || lowerCommand.includes('दिशा')) {
      const locationMatch = command.match(/(?:to|for)\s+(.+)|मैप\s+(.+)/i);
      if (locationMatch) {
        const location = (locationMatch[1] || locationMatch[2]).trim();
        response = AdvancedSystemService.executeCommand(`maps ${location}`);
      } else {
        response = AdvancedSystemService.executeCommand('open maps');
      }
    }
    // News - Hindi/English with real-time search
    else if (lowerCommand.includes('news') || lowerCommand.includes('समाचार') ||
             lowerCommand.includes('ख़बर') || lowerCommand.includes('khabar')) {
      response = 'Fetching latest news...';
      const newsMsg: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newsMsg]);
      if (!isMuted) speak(response);
      
      try {
        const news = await SearchService.searchWeb('latest news today');
        response = news;
      } catch (error) {
        response = 'Unable to fetch news right now';
      }
    }
    // Advanced System commands with tier checking
    else if (lowerCommand.includes('open') || lowerCommand.includes('खोल')) {
      response = AdvancedSystemService.executeCommand(command);
    }
    // Reminders - Hindi/English
    else if (lowerCommand.includes('remind') || lowerCommand.includes('याद')) {
      const reminderMatch = command.match(/remind\s+me\s+(.+?)\s+in\s+(\d+)\s+minute/i);
      if (reminderMatch) {
        const text = reminderMatch[1];
        const minutes = parseInt(reminderMatch[2]);
        response = await ReminderService.setReminder(text, minutes);
      }
    }
    // For everything else - use AI with web search capability
    else {
      console.log('Using intelligent AI with search capability');
      
      // Show searching indicator
      response = 'Let me find that for you...';
      const searchingMsg: ChatMessage = {
        id: Date.now().toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, searchingMsg]);
      if (!isMuted) speak(response);
      
      try {
        // First try web search for factual/current information
        if (lowerCommand.includes('latest') || lowerCommand.includes('current') || 
            lowerCommand.includes('today') || lowerCommand.includes('now') ||
            lowerCommand.includes('price') || lowerCommand.includes('score')) {
          const searchResult = await SearchService.searchWeb(command);
          response = searchResult;
        } else {
          // Use AI for conversational responses
          const { data, error } = await supabase.functions.invoke('openrouter-chat', {
            body: { 
              messages: [{ role: 'user', content: command }]
            }
          });

          if (error) throw error;
          response = data.message || 'Let me search that for you...';
          
          // If AI doesn't have answer, search web
          if (response.toLowerCase().includes("i don't know") || 
              response.toLowerCase().includes("i cannot") ||
              response.toLowerCase().includes("sorry")) {
            const searchResult = await SearchService.searchWeb(command);
            response = searchResult;
          }
        }
      } catch (error) {
        console.error('AI response error:', error);
        // Last resort - try web search
        try {
          const searchResult = await SearchService.searchWeb(command);
          response = searchResult;
        } catch {
          response = 'I\'m having trouble right now. Please try again.';
        }
      }
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
            onActiveChange?.(true);
            
            // Greet only once per session
            if (!hasGreeted) {
              const storedLang = localStorage.getItem('jarvis-language') as 'english' | 'hindi' | 'hinglish' || 'english';
              setDetectedLanguage(storedLang);
              
              const greetings = {
                english: 'Hey there! I\'m online and ready to help, bro.',
                hindi: 'नमस्ते! मैं ऑनलाइन हूँ और मदद के लिए तैयार हूँ।',
                hinglish: 'Hey bro! Main online hun aur ready hun help karne ke liye.'
              };
              
              const greeting = greetings[storedLang];
              
              const voiceEnabled = localStorage.getItem('jarvis-voice-enabled') !== 'false';
              if (voiceEnabled) {
                speak(greeting, { lang: storedLang === 'hindi' ? 'hi-IN' : 'en-US' });
              }
              
              const aiMessage: ChatMessage = {
                id: Date.now().toString(),
                text: greeting,
                isUser: false,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, aiMessage]);
              setHasGreeted(true);
            }
            
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
        onActiveChange?.(true);
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
      
      {/* Automation Manager Modal */}
      <AutomationManager isOpen={showAutomationManager} onClose={() => setShowAutomationManager(false)} />
      
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
            onClick={() => setShowAutomationManager(true)}
            className="text-jarvis-blue hover:bg-jarvis-blue/10 h-8 w-8 sm:h-10 sm:w-10"
            title="Automation Manager"
          >
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </Button>
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
