import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Youtube, 
  Calculator, 
  MessageSquare, 
  Map, 
  Mail, 
  Chrome, 
  ShoppingCart,
  Cloud,
  Music,
  Film,
  Languages,
  Timer,
  Camera,
  Battery,
  Wifi,
  FileText,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Newspaper,
  CloudSun,
  Video
} from 'lucide-react';

interface SystemCommand {
  icon: React.ElementType;
  label: string;
  command: string;
  description: string;
  color: string;
}

interface SystemCommandPanelProps {
  onCommandClick: (command: string) => void;
}

const commands: Record<string, SystemCommand[]> = {
  apps: [
    { icon: Youtube, label: 'YouTube', command: 'open youtube', description: 'Play videos', color: 'hover:bg-red-500/20 hover:border-red-500' },
    { icon: Calculator, label: 'Calculator', command: 'open calculator', description: 'Calculate math', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
    { icon: MessageSquare, label: 'WhatsApp', command: 'open whatsapp', description: 'Send messages', color: 'hover:bg-green-500/20 hover:border-green-500' },
    { icon: Map, label: 'Maps', command: 'open maps', description: 'Get directions', color: 'hover:bg-yellow-500/20 hover:border-yellow-500' },
    { icon: Mail, label: 'Gmail', command: 'open gmail', description: 'Check emails', color: 'hover:bg-red-500/20 hover:border-red-500' },
    { icon: Chrome, label: 'Browser', command: 'open browser', description: 'Browse web', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
  ],
  social: [
    { icon: Facebook, label: 'Facebook', command: 'open facebook', description: 'Social network', color: 'hover:bg-blue-600/20 hover:border-blue-600' },
    { icon: Twitter, label: 'Twitter/X', command: 'open twitter', description: 'Tweets', color: 'hover:bg-sky-500/20 hover:border-sky-500' },
    { icon: Instagram, label: 'Instagram', command: 'open instagram', description: 'Photos', color: 'hover:bg-pink-500/20 hover:border-pink-500' },
    { icon: Linkedin, label: 'LinkedIn', command: 'open linkedin', description: 'Professional', color: 'hover:bg-blue-700/20 hover:border-blue-700' },
  ],
  productivity: [
    { icon: FileText, label: 'Google Docs', command: 'open docs', description: 'Documents', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
    { icon: Cloud, label: 'Google Drive', command: 'open drive', description: 'Cloud storage', color: 'hover:bg-green-500/20 hover:border-green-500' },
    { icon: Timer, label: 'Set Timer', command: 'set timer 5 minutes', description: 'Reminders', color: 'hover:bg-orange-500/20 hover:border-orange-500' },
    { icon: Languages, label: 'Translate', command: 'open translate', description: 'Languages', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
  ],
  entertainment: [
    { icon: Music, label: 'Spotify', command: 'open spotify', description: 'Music', color: 'hover:bg-green-500/20 hover:border-green-500' },
    { icon: Film, label: 'Netflix', command: 'open netflix', description: 'Movies', color: 'hover:bg-red-600/20 hover:border-red-600' },
    { icon: ShoppingCart, label: 'Amazon', command: 'open amazon', description: 'Shopping', color: 'hover:bg-orange-500/20 hover:border-orange-500' },
    { icon: Video, label: 'Zoom', command: 'open zoom', description: 'Video calls', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
  ],
  system: [
    { icon: Battery, label: 'Battery', command: 'check battery', description: 'Power status', color: 'hover:bg-green-500/20 hover:border-green-500' },
    { icon: Wifi, label: 'Network', command: 'check network', description: 'Connection', color: 'hover:bg-blue-500/20 hover:border-blue-500' },
    { icon: Camera, label: 'Screenshot', command: 'take screenshot', description: 'Capture screen', color: 'hover:bg-purple-500/20 hover:border-purple-500' },
    { icon: CloudSun, label: 'Weather', command: 'check weather', description: 'Forecast', color: 'hover:bg-sky-500/20 hover:border-sky-500' },
    { icon: Newspaper, label: 'News', command: 'open news', description: 'Latest news', color: 'hover:bg-gray-500/20 hover:border-gray-500' },
  ]
};

export const SystemCommandPanel = ({ onCommandClick }: SystemCommandPanelProps) => {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-jarvis-blue/20">
      <div className="p-4 border-b border-jarvis-blue/20">
        <h3 className="text-lg font-semibold text-jarvis-blue">
          System Commands
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click or say command to execute
        </p>
      </div>
      
      <Tabs defaultValue="apps" className="h-[calc(100%-80px)]">
        <TabsList className="w-full px-4 bg-transparent border-b border-jarvis-blue/20 rounded-none">
          <TabsTrigger value="apps" className="text-xs">Apps</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="productivity" className="text-xs">Work</TabsTrigger>
          <TabsTrigger value="entertainment" className="text-xs">Fun</TabsTrigger>
          <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
        </TabsList>
        
        {Object.entries(commands).map(([category, categoryCommands]) => (
          <TabsContent key={category} value={category} className="h-[calc(100%-40px)] mt-0">
            <ScrollArea className="h-full p-4">
              <div className="grid grid-cols-2 gap-3">
                {categoryCommands.map((cmd) => (
                  <Button
                    key={cmd.command}
                    variant="outline"
                    className={`h-auto flex-col p-3 border-jarvis-blue/20 bg-background/50 transition-all ${cmd.color}`}
                    onClick={() => onCommandClick(cmd.command)}
                  >
                    <cmd.icon className="w-6 h-6 mb-2 text-jarvis-blue" />
                    <span className="text-xs font-medium">{cmd.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {cmd.description}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
};