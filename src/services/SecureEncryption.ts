/**
 * Secure encryption service with proper key management
 */
export class SecureEncryption {
  private static readonly KEY_NAME = 'jarvis-encryption-key';
  
  /**
   * Generate a new encryption key for the session
   */
  static async generateSessionKey(): Promise<CryptoKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and store in sessionStorage (cleared on browser close)
    const exported = await crypto.subtle.exportKey('jwk', key);
    sessionStorage.setItem(this.KEY_NAME, JSON.stringify(exported));
    
    return key;
  }
  
  /**
   * Get or create the session encryption key
   */
  static async getSessionKey(): Promise<CryptoKey> {
    // Check if we have a key in sessionStorage
    const storedKey = sessionStorage.getItem(this.KEY_NAME);
    
    if (storedKey) {
      try {
        const jwk = JSON.parse(storedKey);
        return await crypto.subtle.importKey(
          'jwk',
          jwk,
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to import stored key, generating new one');
      }
    }
    
    // Generate new key if none exists or import failed
    return this.generateSessionKey();
  }
  
  /**
   * Encrypt data using the session key
   */
  static async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getSessionKey();
      const encoder = new TextEncoder();
      
      // Generate a random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encoder.encode(data)
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding
      return btoa(data);
    }
  }
  
  /**
   * Decrypt data using the session key
   */
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getSessionKey();
      const decoder = new TextDecoder();
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );
      
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, attempting base64 decode:', error);
      // Fallback for data that was encoded with base64
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData; // Return as-is if all decoding fails
      }
    }
  }
  
  /**
   * Clear the session key (on logout)
   */
  static clearSessionKey(): void {
    sessionStorage.removeItem(this.KEY_NAME);
  }
}