import { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isActive: boolean;
}

export const VoiceVisualizer = ({ isListening, isSpeaking, isActive }: VoiceVisualizerProps) => {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (isSpeaking || isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isSpeaking, isListening]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rotating ring */}
      <div className={`absolute w-80 h-80 rounded-full border-2 ${
        isActive ? 'border-jarvis-blue jarvis-border-rotate' : 'border-border'
      }`}>
        <div className="absolute inset-4 rounded-full border border-jarvis-blue/30"></div>
      </div>
      
      {/* Main voice circle */}
      <div className={`relative w-60 h-60 rounded-full border-4 transition-all duration-500 ${
        isActive 
          ? 'border-jarvis-blue bg-jarvis-blue/10 jarvis-glow' 
          : 'border-muted bg-muted/5'
      }`}>
        
        {/* Inner glow effect */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isActive ? 'bg-gradient-to-r from-jarvis-blue/20 to-jarvis-blue-light/20' : ''
        }`}></div>
        
        {/* Voice wave bars */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 bg-jarvis-blue rounded-full transition-all duration-150 ${
                  (isSpeaking || isListening) ? 'jarvis-voice-wave' : ''
                }`}
                style={{
                  height: isSpeaking || isListening 
                    ? `${20 + (audioLevel / 5) + (i * 4)}px` 
                    : '12px',
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isListening ? 'bg-green-400 animate-pulse' :
            isSpeaking ? 'bg-jarvis-blue animate-pulse' :
            isActive ? 'bg-jarvis-blue/60' : 'bg-muted'
          }`}></div>
        </div>
      </div>
      
      {/* Floating particles effect */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-jarvis-blue rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};