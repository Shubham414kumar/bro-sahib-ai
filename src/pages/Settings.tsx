import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Moon, Sun, Volume2, VolumeX, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const savedVoice = localStorage.getItem('jarvis-voice-enabled');
    const savedScroll = localStorage.getItem('jarvis-auto-scroll');
    if (savedVoice !== null) setVoiceEnabled(savedVoice === 'true');
    if (savedScroll !== null) setAutoScroll(savedScroll === 'true');
  }, []);

  const handleVoiceToggle = (checked: boolean) => {
    setVoiceEnabled(checked);
    localStorage.setItem('jarvis-voice-enabled', checked.toString());
  };

  const handleScrollToggle = (checked: boolean) => {
    setAutoScroll(checked);
    localStorage.setItem('jarvis-auto-scroll', checked.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">Customize your JARVIS experience</p>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="space-y-4 max-w-2xl">
          {/* Theme */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-jarvis-blue" />
                ) : (
                  <Sun className="h-5 w-5 text-jarvis-blue" />
                )}
                <div>
                  <Label className="text-base font-semibold">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </Card>

          {/* Voice */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {voiceEnabled ? (
                  <Volume2 className="h-5 w-5 text-jarvis-blue" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-base font-semibold">Voice Output</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI voice responses
                  </p>
                </div>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={handleVoiceToggle}
              />
            </div>
          </Card>

          {/* Auto Scroll */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ScrollText className="h-5 w-5 text-jarvis-blue" />
                <div>
                  <Label className="text-base font-semibold">Auto Scroll</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scroll to latest message
                  </p>
                </div>
              </div>
              <Switch
                checked={autoScroll}
                onCheckedChange={handleScrollToggle}
              />
            </div>
          </Card>

          {/* App Info */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-jarvis-blue">About JARVIS</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Version:</strong> 2.0.0</p>
                <p><strong>Build:</strong> Production</p>
                <p><strong>Platform:</strong> Web, iOS, Android</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
