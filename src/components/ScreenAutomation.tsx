import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Monitor, Search, Volume2, Sun, Wifi, Battery } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ScreenAutomation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const performAction = (action: string) => {
    toast({
      title: `${action} Command`,
      description: `Executing ${action.toLowerCase()} action...`,
    });

    switch (action) {
      case 'Search':
        if (searchQuery.trim()) {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
        }
        break;
      case 'Screenshot':
        toast({
          description: "Screenshot functionality requires native mobile app",
        });
        break;
      case 'Volume':
        toast({
          description: "Volume control requires native device access",
        });
        break;
      case 'Brightness':
        toast({
          description: "Brightness control requires native device access",
        });
        break;
    }
  };

  const systemInfo = [
    { icon: Wifi, label: 'Network', value: 'Connected', color: 'text-green-500' },
    { icon: Battery, label: 'Battery', value: '85%', color: 'text-blue-500' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Screen Automation
          </CardTitle>
          <CardDescription>Control screen and system functions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performAction('Search')}
            />
            <Button onClick={() => performAction('Search')}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button onClick={() => performAction('Screenshot')} variant="outline">
              <Monitor className="mr-2 h-4 w-4" />
              Screenshot
            </Button>
            <Button onClick={() => performAction('Volume')} variant="outline">
              <Volume2 className="mr-2 h-4 w-4" />
              Volume
            </Button>
            <Button onClick={() => performAction('Brightness')} variant="outline">
              <Sun className="mr-2 h-4 w-4" />
              Brightness
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {systemInfo.map((info) => (
              <Card key={info.label} className="bg-muted">
                <CardContent className="flex items-center gap-3 pt-4">
                  <info.icon className={`h-5 w-5 ${info.color}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    <p className="font-semibold">{info.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenAutomation;
