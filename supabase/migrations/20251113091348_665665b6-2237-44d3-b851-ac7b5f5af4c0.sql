-- Create payment_history table to track all payment attempts
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.plans(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'phonepe')),
  transaction_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'completed', 'failed')),
  error_message TEXT,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_transaction_id ON public.payment_history(transaction_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view their own payment history"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert payment records
CREATE POLICY "Service role can insert payment records"
ON public.payment_history
FOR INSERT
WITH CHECK (true);

-- Service role can update payment records
CREATE POLICY "Service role can update payment records"
ON public.payment_history
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_history_updated_at
BEFORE UPDATE ON public.payment_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();