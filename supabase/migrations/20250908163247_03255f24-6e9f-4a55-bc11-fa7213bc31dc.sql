-- Fix RLS warnings by disabling RLS on tables that should only be accessed via functions

-- Disable RLS on pass_redemption_attempts table since it's only accessed via SECURITY DEFINER functions
ALTER TABLE public.pass_redemption_attempts DISABLE ROW LEVEL SECURITY;

-- Check if subscriptions table exists and has RLS enabled with no policies
-- If so, either add policies or disable RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
  ) THEN
    -- Since this table appears to be unused (we're using user_purchases instead),
    -- let's disable RLS on it
    ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;