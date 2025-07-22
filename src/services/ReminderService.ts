import { SecurityService } from './SecurityService';

interface Reminder {
  id: string;
  text: string;
  time: Date;
  completed: boolean;
  encrypted: boolean;
}

export class ReminderService {
  private static STORAGE_KEY = 'jarvis_reminders';
  private static readonly MAX_REMINDERS = 50;
  private static readonly MAX_TEXT_LENGTH = 200;

  static async setReminder(text: string, minutes: number): Promise<string> {
    try {
      // Validate inputs
      const sanitizedText = SecurityService.sanitizeInput(text, this.MAX_TEXT_LENGTH);
      if (!sanitizedText) {
        return 'Invalid reminder text. Please try again.';
      }

      if (minutes <= 0 || minutes > 10080) { // Max 1 week
        return 'Reminder time should be between 1 minute and 1 week.';
      }

      const reminders = await this.getAllReminders();
      
      // Prevent reminder overflow
      if (reminders.length >= this.MAX_REMINDERS) {
        return 'Too many reminders. Please clear some completed reminders first.';
      }

      const encryptedText = await SecurityService.encryptData(sanitizedText);
      const reminder: Reminder = {
        id: Date.now().toString(),
        text: encryptedText,
        time: new Date(Date.now() + minutes * 60000),
        completed: false,
        encrypted: true
      };

      reminders.push(reminder);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));

      // Set browser notification/alert
      setTimeout(() => {
        this.triggerReminder(reminder.id);
      }, minutes * 60000);

      return `Reminder set kar diya hai for "${sanitizedText}" in ${minutes} minutes.`;
    } catch (error) {
      SecurityService.logSecurityEvent('REMINDER_SET_ERROR', error.message);
      return 'Failed to set reminder. Please try again.';
    }
  }

  static async triggerReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getAllReminders();
      const reminder = reminders.find(r => r.id === id && !r.completed);
      
      if (reminder) {
        // Mark as completed
        reminder.completed = true;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
        
        // Decrypt text for display
        const displayText = reminder.encrypted 
          ? await SecurityService.decryptData(reminder.text)
          : reminder.text;
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('JARVIS Reminder', {
            body: displayText,
            icon: '/favicon.ico'
          });
        } else {
          alert(`JARVIS Reminder: ${displayText}`);
        }
      }
    } catch (error) {
      SecurityService.logSecurityEvent('REMINDER_TRIGGER_ERROR', error.message);
    }
  }

  static async getAllReminders(): Promise<Reminder[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Validate stored data structure
      if (!Array.isArray(parsed)) {
        SecurityService.logSecurityEvent('CORRUPTED_REMINDER_DATA', 'Invalid data structure');
        this.clearCompletedReminders();
        return [];
      }
      
      return parsed.filter(item => 
        item && 
        typeof item.id === 'string' && 
        typeof item.text === 'string'
      );
    } catch (error) {
      SecurityService.logSecurityEvent('REMINDER_PARSE_ERROR', error.message);
      this.clearCompletedReminders();
      return [];
    }
  }

  static async clearCompletedReminders(): Promise<void> {
    const reminders = await this.getAllReminders();
    const activeReminders = reminders.filter(r => !r.completed);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeReminders));
  }

  static requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}