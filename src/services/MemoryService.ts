import { supabase } from '@/integrations/supabase/client';

export interface UserMemory {
  id?: string;
  user_id: string;
  memory_key: string;
  memory_value: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationSummary {
  id?: string;
  user_id: string;
  summary: string;
  message_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id?: number;
  user_id: string;
  message_text: string;
  sender: 'user' | 'assistant';
  created_at?: string;
}

export class MemoryService {
  // Store a memory for the user
  static async saveMemory(
    userId: string,
    key: string,
    value: string,
    category: string = 'general'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_memories')
        .upsert({
          user_id: userId,
          memory_key: key,
          memory_value: value,
          category,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,memory_key'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving memory:', error);
      return false;
    }
  }

  // Get a specific memory
  static async getMemory(userId: string, key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('memory_value')
        .eq('user_id', userId)
        .eq('memory_key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.memory_value || null;
    } catch (error) {
      console.error('Error getting memory:', error);
      return null;
    }
  }

  // Get all memories for a user
  static async getAllMemories(userId: string, category?: string): Promise<UserMemory[]> {
    try {
      let query = supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting memories:', error);
      return [];
    }
  }

  // Delete a memory
  static async deleteMemory(userId: string, key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('user_id', userId)
        .eq('memory_key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }

  // Save a chat message to database
  static async saveChatMessage(
    userId: string,
    messageText: string,
    sender: 'user' | 'assistant'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: userId,
          message_text: messageText,
          sender
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
  }

  // Get recent chat messages
  static async getRecentChatMessages(userId: string, limit: number = 20): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      // Reverse to get chronological order
      return (data || []).reverse() as ChatMessage[];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  // Clear chat history
  static async clearChatHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  // Save conversation summary
  static async saveConversationSummary(
    userId: string,
    summary: string,
    messageCount: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_summaries')
        .insert({
          user_id: userId,
          summary,
          message_count: messageCount
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving conversation summary:', error);
      return false;
    }
  }

  // Get latest conversation summaries
  static async getRecentSummaries(userId: string, limit: number = 5): Promise<ConversationSummary[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting conversation summaries:', error);
      return [];
    }
  }

  // Build context string from memories and chat history for AI
  static async buildContextForAI(userId: string): Promise<string> {
    try {
      const [memories, summaries, recentChats] = await Promise.all([
        this.getAllMemories(userId),
        this.getRecentSummaries(userId, 3),
        this.getRecentChatMessages(userId, 10)
      ]);

      let context = '';

      if (memories.length > 0) {
        context += 'User Details:\n';
        memories.forEach(mem => {
          context += `- ${mem.memory_key}: ${mem.memory_value}\n`;
        });
      }

      if (summaries.length > 0) {
        context += '\nPrevious Conversation Summaries:\n';
        summaries.forEach((sum, idx) => {
          context += `${idx + 1}. ${sum.summary}\n`;
        });
      }

      if (recentChats.length > 0) {
        context += '\nRecent Chat History:\n';
        recentChats.forEach(chat => {
          const role = chat.sender === 'user' ? 'User' : 'JARVIS';
          context += `${role}: ${chat.message_text}\n`;
        });
      }

      return context;
    } catch (error) {
      console.error('Error building context:', error);
      return '';
    }
  }
}
