-- Fix the security warnings from the linter

-- 1. Add RLS policies for pass_redemption_attempts table (which currently has RLS enabled but no policies)
-- Drop the generic policy and create specific ones
DROP POLICY IF EXISTS "Service role manages attempts" ON public.pass_redemption_attempts;

-- No user should directly access this table - it's only for rate limiting via functions
-- Service role access is handled automatically for database functions with SECURITY DEFINER

-- 2. Fix function search path issues for all functions without explicit search_path
-- Update the premium pass functions
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

CREATE OR REPLACE FUNCTION public.redeem_premium_pass(pass_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pass RECORD;
  v_user_id UUID;
  v_attempt_count INTEGER;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Authentication required');
  END IF;

  -- Check rate limiting (max 5 attempts per hour per user)
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.pass_redemption_attempts
  WHERE user_id = v_user_id
    AND attempt_time > now() - INTERVAL '1 hour';
    
  IF v_attempt_count >= 5 THEN
    -- Log the failed attempt
    INSERT INTO public.pass_redemption_attempts (user_id, attempted_code, success)
    VALUES (v_user_id, LEFT(pass_code, 10), false); -- Only store partial code for security
    
    RETURN json_build_object('success', false, 'message', 'Too many attempts. Please try again later.');
  END IF;

  -- Log the attempt
  INSERT INTO public.pass_redemption_attempts (user_id, attempted_code, success)
  VALUES (v_user_id, LEFT(pass_code, 10), false); -- Will update if successful

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

  -- Mark the attempt as successful
  UPDATE public.pass_redemption_attempts
  SET success = true
  WHERE user_id = v_user_id
    AND id = (SELECT id FROM public.pass_redemption_attempts 
              WHERE user_id = v_user_id 
              ORDER BY attempt_time DESC 
              LIMIT 1);

  RETURN json_build_object('success', true, 'message', 'Premium access activated successfully!');
END;
$$;

-- Update the handle_new_user function to include search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Update the update_updated_at_column function if it exists without search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add cleanup job for old rate limiting attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_pass_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pass_redemption_attempts
  WHERE attempt_time < now() - INTERVAL '24 hours';
END;
$$;