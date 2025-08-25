-- Create plans table for subscription/one-time payment options
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in paise (Indian currency smallest unit)
  currency TEXT DEFAULT 'INR',
  type TEXT NOT NULL CHECK (type IN ('one-time', 'recurring')),
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table to track payments
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL, -- Amount in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Plans policies (public read access)
CREATE POLICY "Anyone can view plans" 
ON public.plans 
FOR SELECT 
USING (true);

-- Orders policies (users can view their own orders)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Insert sample plans
INSERT INTO public.plans (name, description, price, currency, type, features) VALUES
('Basic Plan', 'Perfect for getting started', 9900, 'INR', 'one-time', '["Voice Assistant Access", "Basic Commands", "5 Daily Reminders"]'),
('Pro Plan', 'Advanced features for power users', 29900, 'INR', 'one-time', '["All Basic Features", "Unlimited Reminders", "Priority Support", "Custom Commands"]'),
('Premium Plan', 'Complete access with all features', 99900, 'INR', 'one-time', '["All Pro Features", "API Access", "Team Collaboration", "Advanced Analytics"]');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();