import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, Gift, Sparkles } from 'lucide-react';
import PlanService from '@/services/PlanService';
import { useToast } from '@/hooks/use-toast';
import { PaymentPlans } from './PaymentPlans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface PremiumGateProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumGate = ({ isOpen, onClose }: PremiumGateProps) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a premium pass code",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    const result = await PlanService.redeemPremiumPass(redeemCode);
    
    toast({
      title: result.success ? "Success!" : "Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setRedeemCode('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    
    setIsRedeeming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-background border rounded-lg shadow-2xl">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Premium Features</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="plans">Choose Plan</TabsTrigger>
              <TabsTrigger value="redeem">Redeem Pass</TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <PaymentPlans />
            </TabsContent>

            <TabsContent value="redeem">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Redeem Premium Pass
                  </CardTitle>
                  <CardDescription>
                    Enter your premium pass code to unlock all features instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter pass code (e.g., JARVIS-PREMIUM-001)"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
                    />
                    <Button onClick={handleRedeem} disabled={isRedeeming}>
                      {isRedeeming ? 'Redeeming...' : 'Redeem'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>Premium passes grant instant access to all features</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};