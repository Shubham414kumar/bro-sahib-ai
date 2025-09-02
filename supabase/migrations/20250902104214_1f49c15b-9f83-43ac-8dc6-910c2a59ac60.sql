-- Create plans table with new tier system
DROP TABLE IF EXISTS public.plans;
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  type TEXT NOT NULL,
  features TEXT[],
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the three plans
INSERT INTO public.plans (name, description, price, currency, type, features, tier) VALUES
('Basic Plan', 'Essential features for everyday use', 9900, 'INR', 'one-time', ARRAY[
  'YouTube video player',
  'Basic calculator',
  'Web browser',
  'Voice commands with Jarvis',
  'Limited system commands'
], 'basic'),
('Standard Plan', 'Advanced features for power users', 29900, 'INR', 'one-time', ARRAY[
  'All Basic features',
  'Gmail integration',
  'WhatsApp launcher',
  'Maps navigation',
  'Full YouTube control',
  'All system commands (open only)',
  'Extended voice commands'
], 'standard'),
('Premium Plan', 'Complete access with priority support', 99900, 'INR', 'one-time', ARRAY[
  'All Standard features',
  'Face recognition',
  'Screen automation',
  'Study assistant',
  'WhatsApp messaging',
  'Priority support',
  'Future updates included',
  'Custom commands'
], 'premium');

-- Create user_purchases table to track purchases
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  tier TEXT NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create premium_passes table for redemption codes
CREATE TABLE public.premium_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert 10 premium passes
INSERT INTO public.premium_passes (code) VALUES
('JARVIS-PREMIUM-001'),
('JARVIS-PREMIUM-002'),
('JARVIS-PREMIUM-003'),
('JARVIS-PREMIUM-004'),
('JARVIS-PREMIUM-005'),
('JARVIS-PREMIUM-006'),
('JARVIS-PREMIUM-007'),
('JARVIS-PREMIUM-008'),
('JARVIS-PREMIUM-009'),
('JARVIS-PREMIUM-010');

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_passes ENABLE ROW LEVEL SECURITY;

-- Plans policies (public read)
CREATE POLICY "Anyone can view plans" ON public.plans
  FOR SELECT USING (true);

-- User purchases policies
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases" ON public.user_purchases
  FOR INSERT WITH CHECK (true);

-- Premium passes policies
CREATE POLICY "Anyone can check if a pass exists" ON public.premium_passes
  FOR SELECT USING (true);

CREATE POLICY "Users can redeem passes" ON public.premium_passes
  FOR UPDATE USING (NOT is_redeemed) WITH CHECK (auth.uid() = redeemed_by);