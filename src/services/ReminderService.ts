
interface Reminder {
  id: string;
  text: string;
  time: Date;
  completed: boolean;
}

export class ReminderService {
  private static STORAGE_KEY = 'jarvis_reminders';
  private static activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  static setReminder(text: string, minutes: number): string {
    const id = Date.now().toString();
    const reminderTime = new Date(Date.now() + minutes * 60 * 1000);
    
    const reminder: Reminder = {
      id,
      text,
      time: reminderTime,
      completed: false
    };

    const reminders = this.getAllReminders();
    reminders.push(reminder);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));

    // Set timeout for the reminder
    const timeout = setTimeout(() => {
      this.triggerReminder(id);
    }, minutes * 60 * 1000);

    this.activeTimeouts.set(id, timeout);

    return `Reminder set for ${minutes} minute${minutes > 1 ? 's' : ''}: "${text}"`;
  }

  private static triggerReminder(id: string): void {
    const reminders = this.getAllReminders();
    const reminder = reminders.find(r => r.id === id);
    
    if (reminder && !reminder.completed) {
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('JARVIS Reminder', {
          body: reminder.text,
          icon: '/favicon.ico'
        });
      } else {
        alert(`JARVIS Reminder: ${reminder.text}`);
      }

      // Mark as completed
      reminder.completed = true;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
      this.activeTimeouts.delete(id);
    }
  }

  static getAllReminders(): Reminder[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearCompletedReminders(): void {
    const reminders = this.getAllReminders().filter(r => !r.completed);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
  }

  static requestNotificationPermission(): void {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
