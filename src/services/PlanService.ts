import { supabase } from '@/lib/supabase';

export type UserTier = 'free' | 'basic' | 'standard' | 'premium';

interface UserPurchase {
  tier: UserTier;
  is_active: boolean;
}

class PlanService {
  private static userTier: UserTier | null = null;

  static async getUserTier(): Promise<UserTier> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return 'free';
      }

      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('tier, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('purchase_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchase) {
        this.userTier = purchase.tier as UserTier;
        return this.userTier;
      }

      return 'free';
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return 'free';
    }
  }

  static async redeemPremiumPass(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'Please login to redeem a pass' };
      }

      // Rate limiting check (max 5 attempts per minute)
      const recentAttempts = sessionStorage.getItem('pass_attempts');
      const attempts = recentAttempts ? JSON.parse(recentAttempts) : [];
      const now = Date.now();
      const recentValidAttempts = attempts.filter((t: number) => now - t < 60000);
      
      if (recentValidAttempts.length >= 5) {
        return { success: false, message: 'Too many attempts. Please wait a minute and try again.' };
      }

      // Use the secure server-side function to redeem the pass
      const { data, error } = await supabase.rpc('redeem_premium_pass', { 
        pass_code: code.trim().toUpperCase() 
      });

      // Update rate limiting
      recentValidAttempts.push(now);
      sessionStorage.setItem('pass_attempts', JSON.stringify(recentValidAttempts));

      if (error) {
        console.error('Error calling redeem function:', error);
        return { success: false, message: 'Failed to redeem pass. Please try again.' };
      }

      if (!data) {
        return { success: false, message: 'Invalid response from server' };
      }

      // The function returns a JSON object with success and message
      if (data.success) {
        this.userTier = 'premium';
      }
      
      return data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error redeeming pass:', error);
      return { success: false, message: 'An error occurred while redeeming the pass' };
    }
  }

  static isFeatureAvailable(feature: string): boolean {
    const tier = this.userTier || 'free';
    
    const featureMatrix: Record<string, UserTier[]> = {
      // Basic features
      'youtube_basic': ['basic', 'standard', 'premium'],
      'calculator': ['basic', 'standard', 'premium'],
      'browser': ['basic', 'standard', 'premium'],
      'voice_commands': ['basic', 'standard', 'premium'],
      
      // Standard features
      'youtube_full': ['standard', 'premium'],
      'gmail': ['standard', 'premium'],
      'whatsapp_open': ['standard', 'premium'],
      'maps': ['standard', 'premium'],
      'all_system_commands': ['standard', 'premium'],
      'weather': ['standard', 'premium'],
      
      // Premium features
      'face_recognition': ['premium'],
      'screen_automation': ['premium'],
      'study_assistant': ['premium'],
      'whatsapp_messaging': ['premium'],
      'call_features': ['premium'],
      'priority_support': ['premium'],
      'custom_commands': ['premium'],
    };

    const allowedTiers = featureMatrix[feature] || [];
    return allowedTiers.includes(tier);
  }
}

export default PlanService;