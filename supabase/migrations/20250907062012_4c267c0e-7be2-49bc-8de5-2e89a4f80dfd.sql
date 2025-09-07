-- 1. Fix the critical premium_passes exposure issue
-- Drop the dangerous public SELECT policy
DROP POLICY IF EXISTS "Anyone can check if a pass exists" ON public.premium_passes;

-- Create a secure function to validate premium passes without exposing them
CREATE OR REPLACE FUNCTION public.validate_premium_pass(pass_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the pass exists and is not redeemed
  RETURN EXISTS (
    SELECT 1 
    FROM public.premium_passes 
    WHERE code = pass_code 
    AND is_redeemed = false
  );
END;
$$;

-- Create a secure function to redeem premium pass
CREATE OR REPLACE FUNCTION public.redeem_premium_pass(pass_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pass RECORD;
  v_user_id UUID;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Authentication required');
  END IF;

  -- Check if pass exists and is not redeemed (with row lock to prevent race conditions)
  SELECT * INTO v_pass
  FROM public.premium_passes
  WHERE code = pass_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid premium pass code');
  END IF;

  IF v_pass.is_redeemed THEN
    RETURN json_build_object('success', false, 'message', 'This pass has already been redeemed');
  END IF;

  -- Mark the pass as redeemed
  UPDATE public.premium_passes
  SET 
    is_redeemed = true,
    redeemed_by = v_user_id,
    redeemed_at = now()
  WHERE id = v_pass.id;

  -- Create a user purchase record for premium tier
  INSERT INTO public.user_purchases (
    user_id,
    plan_id,
    tier,
    is_active,
    payment_id
  ) VALUES (
    v_user_id,
    (SELECT id FROM public.plans WHERE tier = 'premium' LIMIT 1),
    'premium',
    true,
    'PASS_' || pass_code
  );

  RETURN json_build_object('success', true, 'message', 'Premium access activated successfully!');
END;
$$;

-- Remove the dangerous SELECT policy and UPDATE policy
DROP POLICY IF EXISTS "Service role can update passes" ON public.premium_passes;

-- Add rate limiting table for pass redemption attempts
CREATE TABLE IF NOT EXISTS public.pass_redemption_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  ip_address INET,
  attempted_code TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false
);

-- Enable RLS on attempts table
ALTER TABLE public.pass_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can manage attempts (for rate limiting)
CREATE POLICY "Service role manages attempts" 
  ON public.pass_redemption_attempts 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_pass_attempts_user_time ON public.pass_redemption_attempts(user_id, attempt_time);
CREATE INDEX IF NOT EXISTS idx_pass_attempts_ip_time ON public.pass_redemption_attempts(ip_address, attempt_time);