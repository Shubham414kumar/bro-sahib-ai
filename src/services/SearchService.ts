
import { SecurityService } from './SecurityService';

export class SearchService {
  private static readonly MAX_QUERY_LENGTH = 200;
  private static searchHistory: { query: string; timestamp: number }[] = [];
  private static readonly MAX_SEARCHES_PER_MINUTE = 10;

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

      // Use secure fetch with timeout
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(sanitizedQuery)}&format=json&no_html=1&skip_disambig=1`;
      const response = await SecurityService.secureFetch(url);
      const data = await response.json();
      
      // Validate response data
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid response format');
      }
      
      if (data.Abstract) {
        return SecurityService.sanitizeInput(data.Abstract, 500);
      } else if (data.Definition) {
        return SecurityService.sanitizeInput(data.Definition, 500);
      } else if (data.Answer) {
        return SecurityService.sanitizeInput(data.Answer, 500);
      } else {
        return `I searched for "${sanitizedQuery}" but couldn't find a specific answer. You can search manually on Google or DuckDuckGo.`;
      }
    } catch (error) {
      SecurityService.logSecurityEvent('SEARCH_ERROR', `${error.message} - Query: ${query}`);
      
      if (error.message === 'Request timeout') {
        return 'Search request timed out. Please try again.';
      }
      
      return `Sorry, I couldn't search right now. Please check your internet connection.`;
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
