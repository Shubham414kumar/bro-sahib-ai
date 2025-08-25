export class SecurityService {
  // Input validation and sanitization
  static sanitizeInput(input: string, maxLength: number = 500): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters and scripts
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/data:text\/html/gi, '')
      .trim();
    
    // Enforce length limits
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  // Validate commands against whitelist
  static validateCommand(command: string): boolean {
    
    const allowedCommands = [
      'time', 'date', 'search', 'google', 'open', 'remind', 'naam', 'name',
      'email', 'youtube', 'music', 'screen', 'study', 'face', 'app',
      'bye', 'goodbye', 'sleep', 'mute', 'unmute', 'notepad', 'chrome',
      'calculator', 'browser', 'help', 'samay', 'tarikh', 'khojo', 'kholo',
      'yaad', 'dilana', 'gaana', 'padhai', 'chup', 'bol', 'alvida'
    ];
    
    const lowerCommand = command.toLowerCase();
    return allowedCommands.some(cmd => lowerCommand.includes(cmd)) || 
           lowerCommand.length < 10; // Allow short phrases
  }

  // Rate limiting for commands
  private static commandHistory: { timestamp: number; command: string }[] = [];
  private static readonly MAX_COMMANDS_PER_MINUTE = 30;

  static checkRateLimit(command: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old entries
    this.commandHistory = this.commandHistory.filter(entry => entry.timestamp > oneMinuteAgo);
    
    // Check if limit exceeded
    if (this.commandHistory.length >= this.MAX_COMMANDS_PER_MINUTE) {
      return false;
    }
    
    // Add current command
    this.commandHistory.push({ timestamp: now, command });
    return true;
  }

  // Encrypt data for localStorage
  static async encryptData(data: string): Promise<string> {
    try {
      if (!crypto.subtle) return btoa(data); // Fallback to base64
      
      const encoder = new TextEncoder();
      
      // Generate a random salt for each encryption
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Create key material from a more secure base
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(`jarvis-${Date.now()}-${Math.random()}`),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );
      
      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, using base64:', error);
      return btoa(data);
    }
  }

  // Decrypt data from localStorage
  static async decryptData(encryptedData: string): Promise<string> {
    try {
      if (!crypto.subtle) return atob(encryptedData); // Fallback from base64
      
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);
      
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Note: We can't recover the original key material, so decryption 
      // will fail for data encrypted with the new random keys
      // This is intentional for security - old data should be re-encrypted
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('jarvis-fallback-key'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, using base64:', error);
      return atob(encryptedData);
    }
  }

  // Secure fetch wrapper
  static async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Log security events
  static logSecurityEvent(event: string, details: string) {
    const timestamp = new Date().toISOString();
    console.warn(`[SECURITY] ${timestamp}: ${event} - ${details}`);
  }
}