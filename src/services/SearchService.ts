
import { SecurityService } from './SecurityService';

export class SearchService {
  private static readonly MAX_QUERY_LENGTH = 200;
  private static searchHistory: { query: string; timestamp: number }[] = [];
  private static readonly MAX_SEARCHES_PER_MINUTE = 10;
  private static apiKey: string | null = null;

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async searchWeb(query: string): Promise<string> {
    try {
      // Validate and sanitize input
      const sanitizedQuery = SecurityService.sanitizeInput(query, this.MAX_QUERY_LENGTH);
      if (!sanitizedQuery) {
        return 'Invalid search query. Please try again.';
      }

      // Check rate limiting
      if (!this.checkSearchRateLimit()) {
        SecurityService.logSecurityEvent('SEARCH_RATE_LIMIT_EXCEEDED', `Query: ${sanitizedQuery}`);
        return 'Too many searches. Please wait a moment before searching again.';
      }

      // Use DeepSeek API if available
      if (this.apiKey) {
        return await this.searchWithDeepSeek(sanitizedQuery);
      } else {
        return 'API key nahi mila. Please API key enter karo search functionality ke liye.';
      }
    } catch (error) {
      SecurityService.logSecurityEvent('SEARCH_ERROR', `${error.message} - Query: ${query}`);
      
      if (error.message === 'Request timeout') {
        return 'Search request timed out. Please try again.';
      }
      
      return `Sorry, I couldn't search right now. Please check your internet connection.`;
    }
  }

  private static async searchWithDeepSeek(query: string): Promise<string> {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise. Answer in simple language. You are a helpful assistant that answers questions accurately.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return SecurityService.sanitizeInput(data.choices[0].message.content, 1000);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      SecurityService.logSecurityEvent('DEEPSEEK_API_ERROR', `${error.message}`);
      return `Search API mein problem hai: ${error.message}`;
    }
  }

  private static checkSearchRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old searches
    this.searchHistory = this.searchHistory.filter(search => search.timestamp > oneMinuteAgo);
    
    // Check if limit exceeded
    if (this.searchHistory.length >= this.MAX_SEARCHES_PER_MINUTE) {
      return false;
    }
    
    // Add current search
    this.searchHistory.push({ query: 'search', timestamp: now });
    return true;
  }
}
