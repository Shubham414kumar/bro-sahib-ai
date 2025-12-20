-- Fix RLS policies for orders and payment_history tables
-- These tables should NOT be accessible to anonymous/unauthenticated users

-- Drop the overly permissive service role policies
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can insert payment records" ON public.payment_history;
DROP POLICY IF EXISTS "Service role can update payment records" ON public.payment_history;

-- Recreate service role policies with proper TO clause targeting service_role only
-- Note: Service role bypasses RLS anyway, but these policies clarify intent

-- Orders table policies
CREATE POLICY "Authenticated users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Payment history table policies  
CREATE POLICY "Authenticated users can view own payment history"
ON public.payment_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Drop the old user policy that might conflict
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own payment history" ON public.payment_history;