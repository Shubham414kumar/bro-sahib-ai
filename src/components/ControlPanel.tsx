import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Wifi, 
  Monitor,
  Mail,
  Youtube,
  Camera,
  BookOpen,
  Gamepad2
} from 'lucide-react';

interface ControlPanelProps {
  isListening: boolean;
  isMuted: boolean;
  isOnline: boolean;
  activeFeatures: string[];
  onToggleListening: () => void;
  onToggleMute: () => void;
  onFeatureClick: (feature: string) => void;
}

export const ControlPanel = ({ 
  isListening, 
  isMuted, 
  isOnline,
  activeFeatures,
  onToggleListening, 
  onToggleMute,
  onFeatureClick 
}: ControlPanelProps) => {
  
  const features = [
    { id: 'email', label: 'Email Control', icon: Mail },
    { id: 'youtube', label: 'YouTube/Music', icon: Youtube },
    { id: 'face', label: 'Face Recognition', icon: Camera },
    { id: 'screen', label: 'Screen Automation', icon: Monitor },
    { id: 'study', label: 'Study Helper', icon: BookOpen },
    { id: 'apps', label: 'App Control', icon: Gamepad2 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl px-2 sm:px-0">
      {/* Main Controls */}
      <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-jarvis-blue">Voice Controls</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onToggleListening}
              variant={isListening ? 'destructive' : 'default'}
              className={`h-16 text-sm sm:text-base ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-jarvis-blue hover:bg-jarvis-blue-dark'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              <span className="ml-2">{isListening ? 'Stop' : 'Start'}</span>
            </Button>
            
            <Button
              onClick={onToggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              className="h-16 text-sm sm:text-base"
            >
              {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              <span className="ml-2">{isMuted ? 'Muted' : 'Audio'}</span>
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline" size="sm" className="border-jarvis-blue/50">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Feature Controls */}
      <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-jarvis-blue">Available Features</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeatures.includes(feature.id);
              
              return (
                <Button
                  key={feature.id}
                  onClick={() => onFeatureClick(feature.id)}
                  variant={isActive ? "default" : "outline"}
                  className={`h-12 text-xs ${
                    isActive ? 'bg-jarvis-blue/20 border-jarvis-blue' : 'border-jarvis-blue/30'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {feature.label}
                </Button>
              );
            })}
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Supported Languages:</p>
            <div className="flex flex-wrap gap-1">
              {['English', 'Hindi', 'Hinglish', 'Bhojpuri'].map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs border-jarvis-blue/30">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};