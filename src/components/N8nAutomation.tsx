import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Zap, Phone, MessageSquare, Calendar, Mail } from 'lucide-react';

export const N8nAutomation = () => {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = async (action: string, data?: any) => {
    if (!webhookUrl) {
      toast({
        title: "Webhook URL Required",
        description: "Please enter your n8n webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering n8n webhook:", webhookUrl, "Action:", action);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          action,
          timestamp: new Date().toISOString(),
          triggered_from: "JARVIS AI Assistant",
          data
        }),
      });

      toast({
        title: "Automation Triggered",
        description: `${action} workflow has been sent to n8n. Check your n8n dashboard to confirm.`,
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Error",
        description: "Failed to trigger the n8n webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-jarvis-blue" />
          <h2 className="text-xl font-semibold">n8n Automation</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect JARVIS to n8n workflows for advanced automation like calls, messages, and more.
        </p>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook">n8n Webhook URL</Label>
            <Input
              id="webhook"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-background/50 border-jarvis-blue/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Create a webhook in n8n and paste the URL here
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleTrigger('make_call', { type: 'voice_call' })}
              disabled={isLoading || !webhookUrl}
              className="bg-jarvis-blue hover:bg-jarvis-blue/80"
            >
              <Phone className="h-4 w-4 mr-2" />
              Make Call
            </Button>

            <Button
              onClick={() => handleTrigger('send_message', { type: 'sms' })}
              disabled={isLoading || !webhookUrl}
              className="bg-jarvis-blue hover:bg-jarvis-blue/80"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            <Button
              onClick={() => handleTrigger('schedule_meeting', { type: 'calendar' })}
              disabled={isLoading || !webhookUrl}
              className="bg-jarvis-blue hover:bg-jarvis-blue/80"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>

            <Button
              onClick={() => handleTrigger('send_email', { type: 'email' })}
              disabled={isLoading || !webhookUrl}
              className="bg-jarvis-blue hover:bg-jarvis-blue/80"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
        <h3 className="text-lg font-semibold mb-3">Setup Guide</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Open your n8n instance and create a new workflow</li>
          <li>Add a "Webhook" trigger node as the first step</li>
          <li>Copy the webhook URL from n8n</li>
          <li>Paste it in the field above</li>
          <li>Add actions in n8n (Twilio for calls, email nodes, etc.)</li>
          <li>Activate your workflow in n8n</li>
          <li>Click the buttons above to trigger automations!</li>
        </ol>
      </Card>
    </div>
  );
};
