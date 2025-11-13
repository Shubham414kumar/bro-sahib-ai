import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MemoryService } from '@/services/MemoryService';
import { useAuth } from '@/hooks/useAuth';
import { Volume2, Bell } from 'lucide-react';

export interface JarvisPersonality {
  tone: 'professional' | 'friendly' | 'humorous' | 'casual';
  verbosity: number; // 1-5
  responseStyle: 'concise' | 'detailed' | 'conversational';
  customInstructions: string;
  voiceSettings: {
    pitch: number; // 0-2
    rate: number; // 0.5-2
    volume: number; // 0-1
  };
}

interface JarvisSettingsProps {
  onSettingsChange?: (settings: JarvisPersonality) => void;
}

export const JarvisSettings = ({ onSettingsChange }: JarvisSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<JarvisPersonality>({
    tone: 'friendly',
    verbosity: 3,
    responseStyle: 'conversational',
    customInstructions: '',
    voiceSettings: {
      pitch: 1,
      rate: 1,
      volume: 1
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
    // Load audio feedback preference
    const audioFeedback = localStorage.getItem('jarvis-audio-feedback');
    setAudioFeedbackEnabled(audioFeedback !== 'false');
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    const [tone, verbosity, responseStyle, customInstructions, pitch, rate, volume] = await Promise.all([
      MemoryService.getMemory(user.id, 'jarvis_tone'),
      MemoryService.getMemory(user.id, 'jarvis_verbosity'),
      MemoryService.getMemory(user.id, 'jarvis_response_style'),
      MemoryService.getMemory(user.id, 'jarvis_custom_instructions'),
      MemoryService.getMemory(user.id, 'jarvis_voice_pitch'),
      MemoryService.getMemory(user.id, 'jarvis_voice_rate'),
      MemoryService.getMemory(user.id, 'jarvis_voice_volume')
    ]);

    const loadedSettings: JarvisPersonality = {
      tone: (tone as any) || 'friendly',
      verbosity: verbosity ? parseInt(verbosity) : 3,
      responseStyle: (responseStyle as any) || 'conversational',
      customInstructions: customInstructions || '',
      voiceSettings: {
        pitch: pitch ? parseFloat(pitch) : 1,
        rate: rate ? parseFloat(rate) : 1,
        volume: volume ? parseFloat(volume) : 1
      }
    };

    setSettings(loadedSettings);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to save settings",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all([
        MemoryService.saveMemory(user.id, 'jarvis_tone', settings.tone, 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_verbosity', settings.verbosity.toString(), 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_response_style', settings.responseStyle, 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_custom_instructions', settings.customInstructions, 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_voice_pitch', settings.voiceSettings.pitch.toString(), 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_voice_rate', settings.voiceSettings.rate.toString(), 'settings'),
        MemoryService.saveMemory(user.id, 'jarvis_voice_volume', settings.voiceSettings.volume.toString(), 'settings')
      ]);

      toast({
        title: "Settings Saved",
        description: "JARVIS will now use your customized personality",
      });

      // Save audio feedback preference
      localStorage.setItem('jarvis-audio-feedback', audioFeedbackEnabled.toString());

      onSettingsChange?.(settings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioFeedbackToggle = (checked: boolean) => {
    setAudioFeedbackEnabled(checked);
    localStorage.setItem('jarvis-audio-feedback', checked.toString());
    toast({
      title: checked ? "Audio Feedback Enabled" : "Audio Feedback Disabled",
      description: checked ? "JARVIS will play sounds when listening" : "Audio feedback turned off",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <h2 className="text-2xl font-bold text-jarvis-blue mb-6">JARVIS Personality Settings</h2>

        <div className="space-y-6">
          {/* Tone Selection */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-foreground">Response Tone</Label>
            <Select
              value={settings.tone}
              onValueChange={(value: any) => setSettings({ ...settings, tone: value })}
            >
              <SelectTrigger id="tone" className="bg-background/50 border-jarvis-blue/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="humorous">Humorous</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">How JARVIS should communicate with you</p>
          </div>

          {/* Verbosity Slider */}
          <div className="space-y-2">
            <Label className="text-foreground">Response Length</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Brief</span>
              <Slider
                value={[settings.verbosity]}
                onValueChange={(value) => setSettings({ ...settings, verbosity: value[0] })}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Detailed</span>
            </div>
            <p className="text-xs text-muted-foreground">Level: {settings.verbosity}/5</p>
          </div>

          {/* Response Style */}
          <div className="space-y-2">
            <Label htmlFor="style" className="text-foreground">Response Style</Label>
            <Select
              value={settings.responseStyle}
              onValueChange={(value: any) => setSettings({ ...settings, responseStyle: value })}
            >
              <SelectTrigger id="style" className="bg-background/50 border-jarvis-blue/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise - Quick, to the point</SelectItem>
                <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                <SelectItem value="conversational">Conversational - Natural dialogue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="custom" className="text-foreground">Custom Instructions</Label>
            <Textarea
              id="custom"
              placeholder="Add any specific instructions for JARVIS (e.g., 'Always respond in Hindi', 'Use technical terms', etc.)"
              value={settings.customInstructions}
              onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
              className="min-h-[100px] bg-background/50 border-jarvis-blue/20"
            />
            <p className="text-xs text-muted-foreground">Personalize how JARVIS interacts with you</p>
          </div>
        </div>
      </Card>

      {/* Voice Settings */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <div className="flex items-center gap-2 mb-6">
          <Volume2 className="h-5 w-5 text-jarvis-blue" />
          <h2 className="text-2xl font-bold text-jarvis-blue">Voice Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Pitch Control */}
          <div className="space-y-2">
            <Label className="text-foreground">Voice Pitch</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Low</span>
              <Slider
                value={[settings.voiceSettings.pitch]}
                onValueChange={(value) => setSettings({ 
                  ...settings, 
                  voiceSettings: { ...settings.voiceSettings, pitch: value[0] }
                })}
                min={0}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">High</span>
            </div>
            <p className="text-xs text-muted-foreground">Current: {settings.voiceSettings.pitch.toFixed(1)}</p>
          </div>

          {/* Rate Control */}
          <div className="space-y-2">
            <Label className="text-foreground">Speech Rate</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Slow</span>
              <Slider
                value={[settings.voiceSettings.rate]}
                onValueChange={(value) => setSettings({ 
                  ...settings, 
                  voiceSettings: { ...settings.voiceSettings, rate: value[0] }
                })}
                min={0.5}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Fast</span>
            </div>
            <p className="text-xs text-muted-foreground">Current: {settings.voiceSettings.rate.toFixed(1)}x</p>
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <Label className="text-foreground">Voice Volume</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quiet</span>
              <Slider
                value={[settings.voiceSettings.volume]}
                onValueChange={(value) => setSettings({ 
                  ...settings, 
                  voiceSettings: { ...settings.voiceSettings, volume: value[0] }
                })}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Loud</span>
            </div>
            <p className="text-xs text-muted-foreground">Current: {Math.round(settings.voiceSettings.volume * 100)}%</p>
          </div>
        </div>
      </Card>

      {/* Audio Feedback Settings */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-jarvis-blue" />
          <h2 className="text-2xl font-bold text-jarvis-blue">Audio Feedback</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground">Start/Stop Listening Sounds</Label>
              <p className="text-xs text-muted-foreground">
                Play audio cues when JARVIS starts and stops listening
              </p>
            </div>
            <Switch
              checked={audioFeedbackEnabled}
              onCheckedChange={handleAudioFeedbackToggle}
            />
          </div>
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-jarvis-blue hover:bg-jarvis-blue/80"
      >
        {isSaving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
};
