import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, Loader2, Crown, Zap, Star, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  features: string[];
}

export const PaymentPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'phonepe'>('phonepe');
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
    loadRazorpayScript();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      // Parse features from JSON string to array
      const parsedPlans = (data || []).map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : plan.features
      }));
      
      setPlans(parsedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load payment plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const handleRazorpayPayment = async (plan: Plan) => {
    try {
      // Create Razorpay order
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { planId: plan.id }
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Jarvis Assistant",
        description: plan.name,
        order_id: data.orderId,
        handler: async (response: any) => {
          // Verify payment
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          });

          if (verifyError) {
            throw verifyError;
          }

          toast({
            title: "Payment Successful! 🎉",
            description: `You've successfully purchased ${plan.name}`,
          });
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed",
          variant: "destructive",
        });
      });

    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

  const handlePhonePePayment = async (plan: Plan) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-phonepe-order', {
        body: { planId: plan.id }
      });

      if (error) throw error;

      // Redirect to PhonePe payment page
      if (data?.data?.instrumentResponse?.redirectInfo?.url) {
        window.location.href = data.data.instrumentResponse.redirectInfo.url;
      } else {
        throw new Error('PhonePe payment URL not received');
      }

    } catch (error: any) {
      console.error('PhonePe payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate PhonePe payment",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (plan: Plan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to make a payment",
        variant: "destructive",
      });
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(plan);
      } else {
        await handlePhonePePayment(plan);
      }
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getIconForTier = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Star className="h-6 w-6" />;
      case 'standard':
        return <Zap className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'from-blue-500 to-cyan-500';
      case 'standard':
        return 'from-purple-500 to-pink-500';
      case 'premium':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">Choose Your Plan</h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Unlock powerful features for your Jarvis Assistant
        </p>
        
        {/* Payment Method Selector */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <Select value={paymentMethod} onValueChange={(value: 'razorpay' | 'phonepe') => setPaymentMethod(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phonepe">PhonePe</SelectItem>
              <SelectItem value="razorpay">Razorpay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105",
              plan.type === 'premium' && "border-2 border-primary"
            )}
          >
            {plan.type === 'premium' && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                BEST VALUE
              </div>
            )}
            <CardHeader>
              <div className={cn(
                "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-4",
                getTierColor(plan.type)
              )}>
                {getIconForTier(plan.type)}
              </div>
              <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-3xl font-bold">₹{(plan.price / 100).toFixed(0)}</span>
                <span className="text-muted-foreground ml-2 text-xs sm:text-sm">one-time</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4 sm:mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  "w-full text-sm sm:text-base",
                  plan.type === 'premium' && "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                )}
                size="lg"
                onClick={() => handlePayment(plan)}
                disabled={processingPlanId === plan.id}
              >
                {processingPlanId === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};