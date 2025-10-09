-- Restructure plans table to use UUID id instead of type as primary key
-- First, drop the foreign key constraint from subscription table
ALTER TABLE public.subscription DROP CONSTRAINT IF EXISTS subscription_plan_type_fkey;

-- Now we can safely drop the primary key on plans
ALTER TABLE public.plans DROP CONSTRAINT plans_pkey;

-- Add id column with UUID as the new primary key
ALTER TABLE public.plans ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Make type unique to preserve data integrity
ALTER TABLE public.plans ADD CONSTRAINT plans_type_unique UNIQUE (type);

-- Recreate the foreign key on subscription table to use the new id column
-- Note: This assumes subscription.plan_type should map to plans.type
-- If there's data in subscription table, we'll need to handle the mapping