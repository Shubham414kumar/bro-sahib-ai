-- Create execution logs table
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.custom_automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  result_data JSONB,
  error_message TEXT,
  execution_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own logs"
  ON public.automation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON public.automation_logs
  FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_automation_logs_automation_id ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_user_id ON public.automation_logs(user_id);
CREATE INDEX idx_automation_logs_execution_time ON public.automation_logs(execution_time DESC);

-- Enable realtime for automation logs
ALTER TABLE public.automation_logs REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;