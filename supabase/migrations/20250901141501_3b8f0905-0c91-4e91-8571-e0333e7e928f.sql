-- CRITICAL: Fix exposed orders table - remove public read access
DROP POLICY IF EXISTS "Orders can be read by order_id" ON public.orders;

-- Add secure policy: Users can only read their own orders
CREATE POLICY "Users can read own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Keep the existing write-only policy for edge functions
-- Policy "Orders are write-only for edge functions" already exists with WITH CHECK (true)

-- Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  -- Create profile entry
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  
  -- Create subscription entry
  insert into public.subscription (user_id, status, plan)
  values (new.id, 'active', 'Free Plan')
  on conflict do nothing;
  
  return new;
end;
$function$;

-- Ensure auth trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();