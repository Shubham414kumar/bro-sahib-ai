import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit2, Clock, Bell, Command as CommandIcon } from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  type: 'daily' | 'recurring' | 'reminder' | 'webhook';
  schedule_time?: string;
  interval_minutes?: number;
  reminder_datetime?: string;
  action_type: 'notification' | 'search' | 'command' | 'webhook';
  action_data: {
    title?: string;
    message?: string;
    query?: string;
    command?: string;
    url?: string;
  };
  is_active: boolean;
  next_run?: string;
}

interface AutomationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationManager = ({ isOpen, onClose }: AutomationManagerProps) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'daily' as 'daily' | 'recurring' | 'reminder' | 'webhook',
    schedule_time: '08:00',
    interval_minutes: 60,
    reminder_datetime: '',
    action_type: 'notification' as 'notification' | 'search' | 'command' | 'webhook',
    action_data: {
      title: '',
      message: '',
      query: '',
      command: '',
      url: ''
    },
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      loadAutomations();
    }
  }, [isOpen]);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAutomations((data || []) as Automation[]);
    } catch (error) {
      console.error('Error loading automations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutomation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please login to create automations',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const automationData = {
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        schedule_time: formData.type === 'daily' ? formData.schedule_time : null,
        interval_minutes: formData.type === 'recurring' ? formData.interval_minutes : null,
        reminder_datetime: formData.type === 'reminder' ? formData.reminder_datetime : null,
        action_type: formData.action_type,
        action_data: formData.action_data,
        is_active: formData.is_active,
        next_run: calculateNextRun()
      };

      if (editingAutomation) {
        const { error } = await supabase
          .from('custom_automations')
          .update(automationData)
          .eq('id', editingAutomation.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Automation updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('custom_automations')
          .insert(automationData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Automation created successfully'
        });
      }

      setShowAddDialog(false);
      setEditingAutomation(null);
      resetForm();
      loadAutomations();
    } catch (error) {
      console.error('Error saving automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save automation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRun = (): string | null => {
    const now = new Date();
    
    if (formData.type === 'daily' && formData.schedule_time) {
      const [hours, minutes] = formData.schedule_time.split(':').map(Number);
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      return nextRun.toISOString();
    } else if (formData.type === 'recurring' && formData.interval_minutes) {
      const nextRun = new Date(now.getTime() + formData.interval_minutes * 60000);
      return nextRun.toISOString();
    } else if (formData.type === 'reminder' && formData.reminder_datetime) {
      return new Date(formData.reminder_datetime).toISOString();
    }
    
    return null;
  };

  const handleDeleteAutomation = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_automations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Automation deleted successfully'
      });
      
      loadAutomations();
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete automation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (automation: Automation) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_automations')
        .update({ is_active: !automation.is_active })
        .eq('id', automation.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Automation ${!automation.is_active ? 'activated' : 'deactivated'}`
      });
      
      loadAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update automation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      type: automation.type,
      schedule_time: automation.schedule_time || '08:00',
      interval_minutes: automation.interval_minutes || 60,
      reminder_datetime: automation.reminder_datetime || '',
      action_type: automation.action_type,
      action_data: {
        title: automation.action_data.title || '',
        message: automation.action_data.message || '',
        query: automation.action_data.query || '',
        command: automation.action_data.command || '',
        url: automation.action_data.url || ''
      },
      is_active: automation.is_active
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'daily',
      schedule_time: '08:00',
      interval_minutes: 60,
      reminder_datetime: '',
      action_type: 'notification',
      action_data: {
        title: '',
        message: '',
        query: '',
        command: '',
        url: ''
      },
      is_active: true
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="h-4 w-4" />;
      case 'recurring': return <Clock className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      default: return <CommandIcon className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Automation Manager</DialogTitle>
            <DialogDescription>
              Create and manage your custom automations and scheduled tasks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button 
              onClick={() => {
                resetForm();
                setEditingAutomation(null);
                setShowAddDialog(true);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Automation
            </Button>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {loading && automations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : automations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No automations yet. Create your first one!
                  </p>
                ) : (
                  automations.map((automation) => (
                    <Card key={automation.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getActionIcon(automation.type)}
                            <CardTitle className="text-lg">{automation.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={automation.is_active}
                              onCheckedChange={() => handleToggleActive(automation)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAutomation(automation)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAutomation(automation.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          {automation.type === 'daily' && `Daily at ${automation.schedule_time}`}
                          {automation.type === 'recurring' && `Every ${automation.interval_minutes} minutes`}
                          {automation.type === 'reminder' && `On ${new Date(automation.reminder_datetime!).toLocaleString()}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p><strong>Action:</strong> {automation.action_type}</p>
                          {automation.action_data.title && <p><strong>Title:</strong> {automation.action_data.title}</p>}
                          {automation.action_data.message && <p><strong>Message:</strong> {automation.action_data.message}</p>}
                          {automation.action_data.command && <p><strong>Command:</strong> {automation.action_data.command}</p>}
                          {automation.next_run && (
                            <p className="text-muted-foreground">
                              <strong>Next run:</strong> {new Date(automation.next_run).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? 'Edit' : 'Create'} Automation</DialogTitle>
            <DialogDescription>
              Set up your automation schedule and action
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Automation Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Morning News Update"
              />
            </div>

            <div>
              <Label htmlFor="type">Schedule Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (specific time)</SelectItem>
                  <SelectItem value="recurring">Recurring (interval)</SelectItem>
                  <SelectItem value="reminder">One-time Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'daily' && (
              <div>
                <Label htmlFor="schedule_time">Time</Label>
                <Input
                  id="schedule_time"
                  type="time"
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                />
              </div>
            )}

            {formData.type === 'recurring' && (
              <div>
                <Label htmlFor="interval_minutes">Interval (minutes)</Label>
                <Input
                  id="interval_minutes"
                  type="number"
                  min="1"
                  value={formData.interval_minutes}
                  onChange={(e) => setFormData({ ...formData, interval_minutes: parseInt(e.target.value) })}
                />
              </div>
            )}

            {formData.type === 'reminder' && (
              <div>
                <Label htmlFor="reminder_datetime">Date & Time</Label>
                <Input
                  id="reminder_datetime"
                  type="datetime-local"
                  value={formData.reminder_datetime}
                  onChange={(e) => setFormData({ ...formData, reminder_datetime: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="action_type">Action Type</Label>
              <Select 
                value={formData.action_type} 
                onValueChange={(value: any) => setFormData({ ...formData, action_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Show Notification</SelectItem>
                  <SelectItem value="search">Web Search</SelectItem>
                  <SelectItem value="command">Execute Command</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.action_type === 'notification' && (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.action_data.title}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      action_data: { ...formData.action_data, title: e.target.value }
                    })}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.action_data.message}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      action_data: { ...formData.action_data, message: e.target.value }
                    })}
                    placeholder="Notification message"
                  />
                </div>
              </>
            )}

            {formData.action_type === 'search' && (
              <div>
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  value={formData.action_data.query}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    action_data: { ...formData.action_data, query: e.target.value }
                  })}
                  placeholder="e.g., latest tech news"
                />
              </div>
            )}

            {formData.action_type === 'command' && (
              <div>
                <Label htmlFor="command">Command</Label>
                <Input
                  id="command"
                  value={formData.action_data.command}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    action_data: { ...formData.action_data, command: e.target.value }
                  })}
                  placeholder="e.g., play youtube relaxing music"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveAutomation}
                disabled={loading || !formData.name}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Automation'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingAutomation(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
