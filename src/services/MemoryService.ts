
interface MemoryItem {
  key: string;
  value: string;
  timestamp: Date;
}

export class MemoryService {
  private static STORAGE_KEY = 'jarvis_memory';

  static saveMemory(key: string, value: string): void {
    const memories = this.getAllMemories();
    const newMemory: MemoryItem = {
      key: key.toLowerCase(),
      value,
      timestamp: new Date()
    };
    
    memories.push(newMemory);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memories));
    console.log(`Memory saved: ${key} = ${value}`);
  }

  static getMemory(key: string): string | null {
    const memories = this.getAllMemories();
    const memory = memories.find(m => m.key === key.toLowerCase());
    return memory ? memory.value : null;
  }

  static getAllMemories(): MemoryItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static clearMemory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static hasMemoryOf(key: string): boolean {
    return this.getMemory(key) !== null;
  }
}
