-- Create custom_automations table
CREATE TABLE IF NOT EXISTS public.custom_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'recurring', 'reminder', 'webhook')),
  schedule_time TIME, -- For daily tasks (e.g., 08:00:00)
  interval_minutes INTEGER, -- For recurring tasks (e.g., 60 = every hour)
  reminder_datetime TIMESTAMPTZ, -- For one-time reminders
  action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'search', 'command', 'webhook')),
  action_data JSONB NOT NULL DEFAULT '{}', -- Flexible storage for action parameters
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own automations"
  ON public.custom_automations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations"
  ON public.custom_automations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON public.custom_automations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON public.custom_automations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_custom_automations_user_id ON public.custom_automations(user_id);
CREATE INDEX idx_custom_automations_next_run ON public.custom_automations(next_run) WHERE is_active = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_custom_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_automations_updated_at
  BEFORE UPDATE ON public.custom_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_automations_updated_at();