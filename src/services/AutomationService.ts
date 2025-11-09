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

  // Start built-in automation services only
  // Custom automations are handled by the process-automations edge function
  static async startAutomations() {
    console.log('🤖 Starting built-in automation services');
    
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

  // Test execute an automation manually (for Test Run button)
  static async testExecuteAutomation(automation: CustomAutomation): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🧪 Test executing automation: ${automation.name}`);
      
      switch (automation.action_type) {
        case 'notification':
          toast({
            title: `[TEST] ${automation.action_data.title || automation.name}`,
            description: automation.action_data.message || '',
            duration: 5000,
          });
          break;

        case 'search':
          if (automation.action_data.query) {
            const result = await SearchService.searchWeb(automation.action_data.query);
            toast({
              title: `[TEST] Search: ${automation.action_data.query}`,
              description: result.substring(0, 200) + '...',
              duration: 10000,
            });
          }
          break;

        case 'command':
          if (automation.action_data.command) {
            const result = AdvancedSystemService.executeCommand(automation.action_data.command);
            toast({
              title: '[TEST] Command Executed',
              description: result,
              duration: 5000,
            });
          }
          break;

        case 'webhook':
          if (automation.action_data.url) {
            toast({
              title: '[TEST] Webhook',
              description: `Would call: ${automation.action_data.url}`,
              duration: 5000,
            });
          }
          break;

        default:
          throw new Error('Unknown action type');
      }

      // Log the test execution
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('automation_logs').insert({
          automation_id: automation.id,
          user_id: user.id,
          execution_time: new Date().toISOString(),
          status: 'success',
          result_data: { test_run: true },
        });
      }

      return { success: true, message: 'Test executed successfully!' };

    } catch (error) {
      console.error(`Error test executing automation:`, error);
      
      // Log the failed test execution
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('automation_logs').insert({
          automation_id: automation.id,
          user_id: user.id,
          execution_time: new Date().toISOString(),
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          result_data: { test_run: true },
        });
      }

      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Test execution failed' 
      };
    }
  }

  // Stop all automations
  static stopAutomations() {
    console.log('🛑 Stopping built-in automations');
    
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

