import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chrome, Mail, Music, Calculator, FileText, Map, Phone, MessageSquare, Camera, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppController = () => {
  const { toast } = useToast();

  const openApp = (appName: string, url: string) => {
    window.open(url, '_blank');
    toast({
      title: `Opening ${appName}`,
      description: `Launching ${appName} for you...`,
    });
  };

  const apps = [
    { name: 'Chrome', icon: Chrome, url: 'https://www.google.com', color: 'text-blue-500' },
    { name: 'Gmail', icon: Mail, url: 'https://mail.google.com', color: 'text-red-500' },
    { name: 'YouTube', icon: Video, url: 'https://www.youtube.com', color: 'text-red-600' },
    { name: 'Spotify', icon: Music, url: 'https://open.spotify.com', color: 'text-green-500' },
    { name: 'WhatsApp', icon: MessageSquare, url: 'https://web.whatsapp.com', color: 'text-green-600' },
    { name: 'Maps', icon: Map, url: 'https://www.google.com/maps', color: 'text-blue-600' },
    { name: 'Calculator', icon: Calculator, url: 'https://www.google.com/search?q=calculator', color: 'text-purple-500' },
    { name: 'Notes', icon: FileText, url: 'data:text/html,<html><body><textarea style="width:100%;height:100%;font-size:16px;padding:20px;" placeholder="Start typing..."></textarea></body></html>', color: 'text-yellow-600' },
    { name: 'Camera', icon: Camera, url: '#', color: 'text-pink-500' },
  ];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>App Controller</CardTitle>
          <CardDescription>Control and launch apps with JARVIS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {apps.map((app) => (
              <Button
                key={app.name}
                onClick={() => openApp(app.name, app.url)}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <app.icon className={`h-8 w-8 ${app.color}`} />
                <span className="text-sm">{app.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppController;
