-- Fix critical RLS vulnerabilities

-- 1. Fix pass_redemption_attempts table
ALTER TABLE public.pass_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Create deny-all policy (table should only be accessed via SECURITY DEFINER functions)
CREATE POLICY "Deny all direct access" ON public.pass_redemption_attempts
FOR ALL USING (false);

-- 2. Fix premium_passes table  
ALTER TABLE public.premium_passes ENABLE ROW LEVEL SECURITY;

-- Create deny-all policy (table should only be accessed via SECURITY DEFINER functions)
CREATE POLICY "Deny all direct access" ON public.premium_passes
FOR ALL USING (false);

-- 3. Ensure subscriptions table has proper RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- The existing "Allow individual read access" policy is good, just ensure no other operations are allowed

-- 4. Create security_events table for audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert security events
CREATE POLICY "Service role can insert events" ON public.security_events
FOR INSERT WITH CHECK (false);

-- Users can view their own security events
CREATE POLICY "Users can view own events" ON public.security_events
FOR SELECT USING (auth.uid() = user_id);

-- 5. Create rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint, window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits" ON public.rate_limits
FOR ALL USING (false);

-- Create trigger for updating timestamps
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();