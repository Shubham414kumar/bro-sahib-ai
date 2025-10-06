import { PaymentPlans } from '@/components/PaymentPlans';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Payment = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-jarvis-blue hover:bg-jarvis-blue/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
              Upgrade Your JARVIS
            </h1>
            <p className="text-muted-foreground mt-1">
              Choose the perfect plan for your AI assistant
            </p>
          </div>
        </div>

        {/* Payment Plans */}
        <PaymentPlans />
      </div>
    </div>
  );
};

export default Payment;
