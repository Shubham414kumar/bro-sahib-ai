import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface TranscriptEntry {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'listening' | 'processing' | 'speaking' | 'complete';
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

export const LiveTranscript = ({ entries, isListening, isSpeaking, isMuted }: LiveTranscriptProps) => {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-jarvis-blue/20">
      <div className="p-4 border-b border-jarvis-blue/20">
        <h3 className="text-lg font-semibold text-jarvis-blue flex items-center gap-2">
          Live Transcript
          <div className="ml-auto flex gap-2">
            {isListening ? (
              <Mic className="w-4 h-4 text-jarvis-blue animate-pulse" />
            ) : (
              <MicOff className="w-4 h-4 text-muted-foreground" />
            )}
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-destructive" />
            ) : (
              <Volume2 className="w-4 h-4 text-jarvis-blue" />
            )}
          </div>
        </h3>
        {isSpeaking && (
          <p className="text-xs text-jarvis-blue-light mt-1 animate-pulse">
            JARVIS is speaking...
          </p>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100%-80px)] p-4">
        <div className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Say "Hey Bro" to start conversation...
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-lg transition-all ${
                  entry.isUser 
                    ? 'bg-primary/10 border-l-2 border-primary ml-4' 
                    : 'bg-jarvis-blue/10 border-l-2 border-jarvis-blue mr-4'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-medium ${
                    entry.isUser ? 'text-primary' : 'text-jarvis-blue'
                  }`}>
                    {entry.isUser ? 'You' : 'JARVIS'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mt-1 text-foreground/90">
                  {entry.text}
                </p>
                {entry.status && entry.status !== 'complete' && (
                  <div className="mt-2">
                    <span className="text-xs text-jarvis-blue-light animate-pulse">
                      {entry.status === 'listening' && '🎤 Listening...'}
                      {entry.status === 'processing' && '⚡ Processing...'}
                      {entry.status === 'speaking' && '🔊 Speaking...'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};