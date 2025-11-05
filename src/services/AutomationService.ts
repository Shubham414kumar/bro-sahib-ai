import { toast } from '@/hooks/use-toast';
import { SearchService } from './SearchService';

export class AutomationService {
  private static automations: Map<string, NodeJS.Timeout> = new Map();

  // Start automation services
  static startAutomations() {
    console.log('🤖 Starting automation services');
    
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
      
      // Speak briefing if voice is enabled
      if (localStorage.getItem('jarvis-voice-enabled') !== 'false') {
        // This would need to be passed from component
        console.log('Morning briefing ready:', briefing);
      }
    });

    // Evening summary at 6 PM
    this.scheduleDailyTask('evening-summary', 18, 0, () => {
      toast({
        title: '🌆 Evening Summary',
        description: 'Your day summary is ready. Say "Hey bro, give me my summary"',
        duration: 5000,
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

  // Stop all automations
  static stopAutomations() {
    console.log('🛑 Stopping all automations');
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
        lowerCommand.includes('hey')) {
      if (hour >= 5 && hour < 12) return 'Good morning! How can I help you today?';
      if (hour >= 12 && hour < 17) return 'Good afternoon! What can I do for you?';
      if (hour >= 17 && hour < 22) return 'Good evening! Ready to assist!';
      return 'Hello! I\'m here to help, even at this late hour!';
    }

    // Weather-based suggestions
    if (lowerCommand.includes('what should i do') || 
        lowerCommand.includes('suggest something')) {
      const suggestions = this.getSmartSuggestions();
      return `Based on the time, I suggest: ${suggestions.join(', ')}`;
    }

    return null;
  }
}
