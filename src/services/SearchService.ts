
export class SearchService {
  static async searchWeb(query: string): Promise<string> {
    try {
      // Using DuckDuckGo Instant Answer API (free, no API key required)
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      if (data.Abstract) {
        return data.Abstract;
      } else if (data.Definition) {
        return data.Definition;
      } else if (data.Answer) {
        return data.Answer;
      } else {
        return `I searched for "${query}" but couldn't find a specific answer. You can search manually on Google or DuckDuckGo.`;
      }
    } catch (error) {
      console.error('Search error:', error);
      return `Sorry, I couldn't search for "${query}" right now. Please check your internet connection.`;
    }
  }
}
