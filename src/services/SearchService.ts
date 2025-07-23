
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

      // Use Perplexity API if available
      if (this.apiKey) {
        return await this.searchWithPerplexity(sanitizedQuery);
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

  private static async searchWithPerplexity(query: string): Promise<string> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise. Answer in simple language.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 500,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
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
      SecurityService.logSecurityEvent('PERPLEXITY_API_ERROR', `${error.message}`);
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
