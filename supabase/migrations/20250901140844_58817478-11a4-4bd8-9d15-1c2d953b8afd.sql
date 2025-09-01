-- Fix search_path for update_updated_at_column function
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

-- Fix search_path for handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  insert into public.subscription (user_id, status, plan)
  values (new.id, 'active', 'Free Plan');
  return new;
end;
$function$;

-- Fix search_path for redeem_pass_and_subscribe function
CREATE OR REPLACE FUNCTION public.redeem_pass_and_subscribe(user_id_to_update uuid, pass_code_to_redeem text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    found_pass RECORD;
    plan_details RECORD;
BEGIN
    -- Step 1: Find the pass and lock it to prevent race conditions
    SELECT * INTO found_pass
    FROM public.access_passes
    WHERE pass_code = pass_code_to_redeem
    FOR UPDATE;

    -- Step 2: Validate the pass
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid pass code.';
    END IF;

    IF found_pass.is_used THEN
        RAISE EXCEPTION 'This pass code has already been used.';
    END IF;

    -- Step 3: Deactivate any previous active subscriptions for this user
    UPDATE public.subscriptions
    SET status = 'inactive'
    WHERE user_id = user_id_to_update AND status = 'active';

    -- Step 4: Insert the new subscription
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (user_id_to_update, found_pass.plan_id, 'active');

    -- Step 5: Mark the pass as used
    UPDATE public.access_passes
    SET is_used = TRUE, redeemed_by_user_id = user_id_to_update
    WHERE id = found_pass.id;

    -- Step 6: Get the plan name for the success message
    SELECT name INTO plan_details
    FROM public.plans
    WHERE id = found_pass.plan_id;

    -- Step 7: Return a success message
    RETURN json_build_object('message', 'Successfully upgraded to ' || plan_details.name || '!');
END;
$function$;