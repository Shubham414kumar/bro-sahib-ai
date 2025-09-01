import { SecurityService } from './SecurityService';
import { SecureEncryption } from './SecureEncryption';

interface MemoryItem {
  key: string;
  value: string;
  timestamp: Date;
  encrypted: boolean;
}

export class MemoryService {
  private static STORAGE_KEY = 'jarvis_memory';
  private static readonly MAX_MEMORIES = 100;
  private static readonly MAX_VALUE_LENGTH = 1000;

  static async saveMemory(key: string, value: string): Promise<void> {
    try {
      // Validate and sanitize inputs
      const sanitizedKey = SecurityService.sanitizeInput(key, 50);
      const sanitizedValue = SecurityService.sanitizeInput(value, this.MAX_VALUE_LENGTH);
      
      if (!sanitizedKey || !sanitizedValue) {
        SecurityService.logSecurityEvent('INVALID_MEMORY_INPUT', `Key: ${key}, Value length: ${value.length}`);
        return;
      }

      const memories = await this.getAllMemories();
      
      // Prevent memory overflow
      if (memories.length >= this.MAX_MEMORIES) {
        memories.shift(); // Remove oldest memory
      }
      
      const encryptedValue = await SecureEncryption.encrypt(sanitizedValue);
      const newMemory: MemoryItem = {
        key: sanitizedKey.toLowerCase(),
        value: encryptedValue,
        timestamp: new Date(),
        encrypted: true
      };
      
      memories.push(newMemory);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memories));
      console.log(`Memory saved securely: ${sanitizedKey}`);
    } catch (error) {
      SecurityService.logSecurityEvent('MEMORY_SAVE_ERROR', error.message);
    }
  }

  static async getMemory(key: string): Promise<string | null> {
    try {
      const sanitizedKey = SecurityService.sanitizeInput(key, 50);
      if (!sanitizedKey) return null;
      
      const memories = await this.getAllMemories();
      const memory = memories.find(m => m.key === sanitizedKey.toLowerCase());
      
      if (!memory) return null;
      
      if (memory.encrypted) {
        return await SecureEncryption.decrypt(memory.value);
      }
      
      return memory.value;
    } catch (error) {
      SecurityService.logSecurityEvent('MEMORY_READ_ERROR', error.message);
      return null;
    }
  }

  static async getAllMemories(): Promise<MemoryItem[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Validate stored data structure
      if (!Array.isArray(parsed)) {
        SecurityService.logSecurityEvent('CORRUPTED_MEMORY_DATA', 'Invalid data structure');
        this.clearMemory();
        return [];
      }
      
      return parsed.filter(item => 
        item && 
        typeof item.key === 'string' && 
        typeof item.value === 'string'
      );
    } catch (error) {
      SecurityService.logSecurityEvent('MEMORY_PARSE_ERROR', error.message);
      this.clearMemory();
      return [];
    }
  }

  static clearMemory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static async hasMemoryOf(key: string): Promise<boolean> {
    const memory = await this.getMemory(key);
    return memory !== null;
  }
}