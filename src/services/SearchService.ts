
import { SecurityService } from './SecurityService';
import { supabase } from '@/integrations/supabase/client';

export class SearchService {
  private static readonly MAX_QUERY_LENGTH = 200;
  private static searchHistory: { query: string; timestamp: number }[] = [];
  private static readonly MAX_SEARCHES_PER_MINUTE = 10;

  static async searchWeb(query: string): Promise<string> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return 'Please sign in to use the search feature.';
      }
      
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

      // Use the edge function for DeepSeek search with authentication
      const { data, error } = await supabase.functions.invoke('deepseek-search', {
        body: { query: sanitizedQuery },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Search error:', error);
        return 'Search service mein problem hai. Please try again later.';
      }
      
      return data.result || 'No response from search service.';
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
