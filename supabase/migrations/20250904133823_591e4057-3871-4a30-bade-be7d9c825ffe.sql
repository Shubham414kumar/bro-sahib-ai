-- Drop the incorrect subscription table reference from handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the corrected handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Create profile entry
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  
  return new;
end;
$function$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();