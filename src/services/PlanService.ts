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
        .single();

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

      // Check if pass exists and is not redeemed
      const { data: pass, error: passError } = await supabase
        .from('premium_passes')
        .select('*')
        .eq('code', code)
        .single();

      if (passError || !pass) {
        return { success: false, message: 'Invalid premium pass code' };
      }

      if (pass.is_redeemed) {
        return { success: false, message: 'This pass has already been redeemed' };
      }

      // Get premium plan
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', 'premium')
        .single();

      if (!plan) {
        return { success: false, message: 'Premium plan not found' };
      }

      // Update pass as redeemed
      const { error: updateError } = await supabase
        .from('premium_passes')
        .update({ 
          is_redeemed: true, 
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('code', code);

      if (updateError) {
        return { success: false, message: 'Failed to redeem pass' };
      }

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          tier: 'premium',
          is_active: true,
          payment_id: `PASS_${code}`
        });

      if (purchaseError) {
        return { success: false, message: 'Failed to activate premium' };
      }

      this.userTier = 'premium';
      return { success: true, message: 'Premium access activated successfully!' };
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
      
      // Premium features
      'face_recognition': ['premium'],
      'screen_automation': ['premium'],
      'study_assistant': ['premium'],
      'whatsapp_messaging': ['premium'],
      'priority_support': ['premium'],
      'custom_commands': ['premium'],
    };

    const allowedTiers = featureMatrix[feature] || [];
    return allowedTiers.includes(tier);
  }
}

export default PlanService;