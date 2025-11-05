import { toast } from '@/hooks/use-toast';
import { SearchService } from './SearchService';
import { AdvancedSystemService } from './AdvancedSystemService';
import { supabase } from '@/integrations/supabase/client';

interface CustomAutomation {
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
  last_run?: string;
  next_run?: string;
}

export class AutomationService {
  private static automations: Map<string, NodeJS.Timeout> = new Map();
  private static customAutomations: CustomAutomation[] = [];
  private static checkInterval: NodeJS.Timeout | null = null;

  // Start automation services
  static async startAutomations() {
    console.log('🤖 Starting automation services');
    
    // Load custom automations from database
    await this.loadCustomAutomations();
    
    // Start checking for due automations every minute
    this.checkInterval = setInterval(() => {
      this.checkDueAutomations();
    }, 60000); // Check every minute
    
    // Check immediately on start
    this.checkDueAutomations();
    
    // Built-in automations
    // Morning briefing at 8 AM
    this.scheduleDailyTask('morning-briefing', 8, 0, async () => {
      const weather = await SearchService.searchWeb('weather today');
      const news = await SearchService.searchWeb('top news today');
      
      const briefing = `Good morning! Here's your daily briefing:\n\nWeather: ${weather}\n\nNews: ${news}`;
      
      toast({
        title: '🌅 Morning Briefing',
        description: briefing.substring(0, 200) + '...',
        duration: 10000,
      });
    });

    // Hydration reminder every 2 hours
    this.scheduleRecurringTask('hydration', 2 * 60 * 60 * 1000, () => {
      toast({
        title: '💧 Hydration Reminder',
        description: 'Time to drink some water! Stay hydrated.',
        duration: 5000,
      });
    });

    // Posture check every hour
    this.scheduleRecurringTask('posture', 60 * 60 * 1000, () => {
      toast({
        title: '🪑 Posture Check',
        description: 'Sit up straight and stretch a bit!',
        duration: 5000,
      });
    });
  }

  // Load custom automations from database
  static async loadCustomAutomations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_automations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.customAutomations = (data || []) as CustomAutomation[];
      console.log(`📋 Loaded ${this.customAutomations.length} custom automations`);
    } catch (error) {
      console.error('Error loading custom automations:', error);
    }
  }

  // Check for due automations
  static async checkDueAutomations() {
    const now = new Date();
    
    for (const automation of this.customAutomations) {
      if (!automation.is_active || !automation.next_run) continue;
      
      const nextRun = new Date(automation.next_run);
      
      // If automation is due
      if (nextRun <= now) {
        console.log(`⏰ Executing automation: ${automation.name}`);
        await this.executeAutomation(automation);
        
        // Update next run time
        await this.updateNextRun(automation);
      }
    }
  }

  // Execute an automation
  static async executeAutomation(automation: CustomAutomation) {
    try {
      switch (automation.action_type) {
        case 'notification':
          toast({
            title: automation.action_data.title || automation.name,
            description: automation.action_data.message || '',
            duration: 5000,
          });
          break;

        case 'search':
          if (automation.action_data.query) {
            const result = await SearchService.searchWeb(automation.action_data.query);
            toast({
              title: `Search Results: ${automation.action_data.query}`,
              description: result.substring(0, 200) + '...',
              duration: 10000,
            });
          }
          break;

        case 'command':
          if (automation.action_data.command) {
            const result = AdvancedSystemService.executeCommand(automation.action_data.command);
            toast({
              title: 'Command Executed',
              description: result,
              duration: 5000,
            });
          }
          break;
      }

      // Update last_run
      await supabase
        .from('custom_automations')
        .update({ last_run: new Date().toISOString() })
        .eq('id', automation.id);

    } catch (error) {
      console.error(`Error executing automation ${automation.name}:`, error);
    }
  }

  // Update next run time
  static async updateNextRun(automation: CustomAutomation) {
    let nextRun: Date | null = null;
    const now = new Date();

    if (automation.type === 'daily' && automation.schedule_time) {
      const [hours, minutes] = automation.schedule_time.split(':').map(Number);
      nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (automation.type === 'recurring' && automation.interval_minutes) {
      nextRun = new Date(now.getTime() + automation.interval_minutes * 60000);
    } else if (automation.type === 'reminder') {
      // One-time reminder, deactivate after execution
      await supabase
        .from('custom_automations')
        .update({ is_active: false })
        .eq('id', automation.id);
      
      // Reload automations
      await this.loadCustomAutomations();
      return;
    }

    if (nextRun) {
      await supabase
        .from('custom_automations')
        .update({ next_run: nextRun.toISOString() })
        .eq('id', automation.id);
    }

    // Reload automations to get updated data
    await this.loadCustomAutomations();
  }

  // Stop all automations
  static stopAutomations() {
    console.log('🛑 Stopping all automations');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.automations.forEach((timeout) => clearTimeout(timeout));
    this.automations.clear();
  }

  // Schedule a task for specific time daily
  private static scheduleDailyTask(
    id: string,
    hour: number,
    minute: number,
    task: () => void
  ) {
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
      0
    );

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntil = scheduledTime.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      task();
      // Reschedule for next day
      this.scheduleDailyTask(id, hour, minute, task);
    }, timeUntil);

    this.automations.set(id, timeout);
    console.log(`📅 Scheduled ${id} at ${hour}:${minute}`);
  }

  // Schedule recurring task
  private static scheduleRecurringTask(
    id: string,
    interval: number,
    task: () => void
  ) {
    const timeout = setInterval(task, interval);
    this.automations.set(id, timeout as any);
    console.log(`🔄 Scheduled recurring ${id} every ${interval}ms`);
  }

  // Smart suggestions based on time
  static getSmartSuggestions(): string[] {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return [
        'Check weather',
        'Play morning music',
        'Read news',
        'Set reminders for today'
      ];
    } else if (hour >= 12 && hour < 17) {
      return [
        'Calculate something',
        'Search information',
        'Open YouTube',
        'Check emails'
      ];
    } else if (hour >= 17 && hour < 22) {
      return [
        'Play music',
        'Check news',
        'Open WhatsApp',
        'Set timer'
      ];
    } else {
      return [
        'Set alarm',
        'Play relaxing music',
        'Check tomorrow\'s weather',
        'Goodnight message'
      ];
    }
  }

  // Context-aware responses
  static getContextualResponse(command: string): string | null {
    const hour = new Date().getHours();
    const lowerCommand = command.toLowerCase();

    // Time-based greetings
    if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || 
        lowerCommand.includes('hey') || lowerCommand.includes('नमस्ते') ||
        lowerCommand.includes('हेलो')) {
      if (hour >= 5 && hour < 12) return 'Good morning! How can I help you today?';
      if (hour >= 12 && hour < 17) return 'Good afternoon! What can I do for you?';
      if (hour >= 17 && hour < 22) return 'Good evening! Ready to assist!';
      return 'Hello! I\'m here to help, even at this late hour!';
    }

    // Weather-based suggestions
    if (lowerCommand.includes('what should i do') || 
        lowerCommand.includes('suggest something') ||
        lowerCommand.includes('क्या करूं')) {
      const suggestions = this.getSmartSuggestions();
      return `Based on the time, I suggest: ${suggestions.join(', ')}`;
    }

    return null;
  }
}

