import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { NavigationBar } from '@/components/NavigationBar';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'error';

export default function PaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get transaction ID from URL params
      const transactionId = searchParams.get('transactionId') || 
                          searchParams.get('merchantTransactionId');

      if (!transactionId) {
        setStatus('error');
        setMessage('No transaction ID found in URL');
        return;
      }

      console.log('🔍 Verifying payment for transaction:', transactionId);

      // Call the verify-phonepe-payment edge function
      const { data, error } = await supabase.functions.invoke('verify-phonepe-payment', {
        body: { transactionId }
      });

      if (error) {
        console.error('❌ Payment verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify payment');
        return;
      }

      console.log('✅ Payment verification response:', data);

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Payment successful! Your subscription is now active.');
        setTransactionDetails(data.paymentData);
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(data.message || 'Payment verification failed');
        setTransactionDetails(data.paymentData);
      }
    } catch (error: any) {
      console.error('❌ Payment verification exception:', error);
      setStatus('error');
      setMessage(error.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-jarvis-blue/20 md:hidden">
        <div className="container mx-auto px-4 py-3">
          <NavigationBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pt-20 md:pt-6 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-jarvis-blue animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
            )}
            {(status === 'failed' || status === 'error') && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              {status === 'verifying' && 'Verifying Payment'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'failed' && 'Payment Failed'}
              {status === 'error' && 'Verification Error'}
            </h1>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* Transaction Details */}
          {transactionDetails && (
            <div className="mb-6 p-4 bg-background/50 rounded-lg border border-jarvis-blue/20">
              <h3 className="text-sm font-semibold text-jarvis-blue mb-2">Transaction Details</h3>
              <div className="space-y-1 text-sm">
                {transactionDetails.transactionId && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">ID:</span> {transactionDetails.transactionId}
                  </p>
                )}
                {transactionDetails.amount && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Amount:</span> ₹{(transactionDetails.amount / 100).toFixed(2)}
                  </p>
                )}
                {transactionDetails.state && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Status:</span> {transactionDetails.state}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {status === 'success' && (
              <p className="text-sm text-center text-muted-foreground">
                Redirecting to home in 3 seconds...
              </p>
            )}
            
            {(status === 'failed' || status === 'error') && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/payment')}
                  className="w-full bg-jarvis-blue hover:bg-jarvis-blue/80"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            )}

            {status === 'verifying' && (
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}