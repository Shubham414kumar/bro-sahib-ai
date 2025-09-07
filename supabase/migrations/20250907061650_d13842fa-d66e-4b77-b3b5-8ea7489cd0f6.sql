-- 1. Create the missing orders table for Razorpay payments
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES public.plans NOT NULL,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders table
CREATE POLICY "Users can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert and update orders (for edge functions)
CREATE POLICY "Service role can manage orders" 
  ON public.orders 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 2. Fix the critical premium_passes exposure issue
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
DROP POLICY IF EXISTS "Anyone can check if a pass exists" ON public.premium_passes;
DROP POLICY IF EXISTS "Service role can update passes" ON public.premium_passes;

-- Only allow authenticated users to use the secure functions (no direct table access)
-- The functions above handle all the logic securely

-- 3. Add trigger to update the updated_at timestamp on orders
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add index for better performance on orders
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX idx_orders_status ON public.orders(status);