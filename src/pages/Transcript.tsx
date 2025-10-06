import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Transcript = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = localStorage.getItem('jarvis-auto-scroll') !== 'false';

  useEffect(() => {
    // Load messages from localStorage
    const saved = localStorage.getItem('jarvis-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }

    // Listen for new messages
    const handleStorage = () => {
      const saved = localStorage.getItem('jarvis-messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        } catch (e) {
          console.error('Failed to load messages:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('jarvis-messages');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-jarvis-blue hover:bg-jarvis-blue/10"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
                Conversation
              </h1>
              <p className="text-sm text-muted-foreground">{messages.length} messages</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearHistory}
            className="text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <Card className="flex-1 bg-card/50 backdrop-blur-sm border-jarvis-blue/30 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">Start talking to JARVIS to see your conversation here</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.isUser
                          ? 'bg-jarvis-blue text-white'
                          : 'bg-card border border-jarvis-blue/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm mb-1">{msg.text}</p>
                          <p className={`text-xs ${msg.isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {msg.timestamp.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Transcript;
