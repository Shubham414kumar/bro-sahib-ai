-- Update existing plans with better features and pricing
UPDATE public.plans
SET 
  name = 'Basic Plan',
  description = 'Essential features for getting started with JARVIS',
  price = 9900,
  features = '["Voice Commands", "Email Integration", "YouTube Control", "Basic Reminders", "Time & Date", "Calculator", "Web Search"]'
WHERE type = 'free';

UPDATE public.plans
SET 
  name = 'Standard Plan',
  description = 'Advanced features for power users',
  price = 29900,
  features = '["All Basic Features", "Face Recognition", "Screen Automation", "Study Helper", "App Control", "Advanced System Commands", "WhatsApp Integration", "Maps & Navigation", "Priority Support"]'
WHERE type = 'pro';

UPDATE public.plans
SET 
  name = 'Premium Plan',
  description = 'Complete access to all premium features',
  price = 49900,
  features = '["All Standard Features", "Call Management", "Auto Scheduler", "Premium Voice Models", "Unlimited AI Requests", "Custom Wake Words", "Advanced Memory", "24/7 Premium Support", "Early Access to New Features", "Offline Mode"]'
WHERE type = 'premium';

-- Insert 10 more premium passes to make 20 total
INSERT INTO public.premium_passes (code, is_redeemed) VALUES
('JARVIS-PREMIUM-2025-011', false),
('JARVIS-PREMIUM-2025-012', false),
('JARVIS-PREMIUM-2025-013', false),
('JARVIS-PREMIUM-2025-014', false),
('JARVIS-PREMIUM-2025-015', false),
('JARVIS-PREMIUM-2025-016', false),
('JARVIS-PREMIUM-2025-017', false),
('JARVIS-PREMIUM-2025-018', false),
('JARVIS-PREMIUM-2025-019', false),
('JARVIS-PREMIUM-2025-020', false);