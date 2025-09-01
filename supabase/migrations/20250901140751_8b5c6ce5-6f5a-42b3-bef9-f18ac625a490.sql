-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

-- Create a policy that allows users to read only their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy that allows users to update only their own profile
DROP POLICY IF EXISTS "Profiles can be updated" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own profile
DROP POLICY IF EXISTS "Profiles can be created" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);