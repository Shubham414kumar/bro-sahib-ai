import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { User, Gift, Share2, Copy, Check, Crown, Mail, Calendar } from 'lucide-react';
import PlanService, { UserTier } from '@/services/PlanService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile = ({ isOpen, onClose }: UserProfileProps) => {
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Load user tier
      PlanService.getUserTier().then(setUserTier);
      
      // Generate referral code from user ID
      setReferralCode(user.id.substring(0, 8).toUpperCase());
      
      // Load profile data
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('purchase_date', { ascending: false })
      .limit(1)
      .single();
    
    setProfileData({ profile, purchase });
  };

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
      setUserTier('premium');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    
    setIsRedeeming(false);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`Join JARVIS AI using my code: ${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const getTierColor = () => {
    switch(userTier) {
      case 'basic': return 'text-blue-500';
      case 'standard': return 'text-purple-500';
      case 'premium': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getTierBadge = () => {
    switch(userTier) {
      case 'basic': return 'bg-blue-500';
      case 'standard': return 'bg-purple-500';
      case 'premium': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-jarvis-blue/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-jarvis-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user?.email}</h3>
                    <p className="text-sm text-muted-foreground">
                      Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full ${getTierBadge()} text-white text-xs font-bold`}>
                  {userTier.toUpperCase()}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className={`h-4 w-4 ${getTierColor()}`} />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{userTier} Plan</p>
                  {profileData?.purchase && (
                    <p className="text-xs text-muted-foreground">
                      Active since {new Date(profileData.purchase.purchase_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {userTier !== 'premium' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      onClose();
                      // Trigger premium gate from parent
                    }}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Refer & Earn
              </CardTitle>
              <CardDescription>
                Share your code with friends and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="font-mono font-bold text-center"
                />
                <Button 
                  size="icon"
                  onClick={handleCopyReferral}
                  variant="outline"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Get 7 days free when your friend upgrades!
              </p>
            </CardContent>
          </Card>

          {/* Redeem Code */}
          {userTier !== 'premium' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Redeem Premium Pass
                </CardTitle>
                <CardDescription>
                  Have a premium pass? Enter it here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter pass code"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
                  />
                  <Button onClick={handleRedeem} disabled={isRedeeming}>
                    {isRedeeming ? 'Redeeming...' : 'Redeem'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};