import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
}

export const ChatHistory = ({ messages }: ChatHistoryProps) => {
  return (
    <Card className="w-full max-w-2xl h-96 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
      <div className="p-4 border-b border-jarvis-blue/20">
        <h3 className="text-lg font-semibold text-jarvis-blue">Chat History</h3>
      </div>
      
      <ScrollArea className="h-80 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Say "Hey Bro" to start the conversation...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} jarvis-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-jarvis-blue text-jarvis-dark ml-4'
                      : 'bg-jarvis-dark-light text-foreground mr-4 border border-jarvis-blue/20'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                    <span>{message.isUser ? 'You' : 'JARVIS'}</span>
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};