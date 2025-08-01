import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Mail, Phone, Shield, Check, X } from 'lucide-react';

interface ProfessionalLoginPanelProps {
  onLogin: (userData: { name: string; email: string }) => void;
}

export const ProfessionalLoginPanel: React.FC<ProfessionalLoginPanelProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { toast } = useToast();

  // Password strength validation
  const validatePassword = (pwd: string) => {
    const criteria = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    
    const score = Object.values(criteria).filter(Boolean).length;
    return { criteria, score, isStrong: score >= 4 };
  };

  const passwordValidation = validatePassword(password);

  const handleEmailSignup = async () => {
    if (!acceptTerms) {
      toast({
        title: 'Terms & Conditions Required',
        description: 'Please accept the terms and conditions to continue.',
        variant: 'destructive'
      });
      return;
    }

    if (!passwordValidation.isStrong) {
      toast({
        title: 'Weak Password',
        description: 'Please create a stronger password.',
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting signup process...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { 
            full_name: name,
            name: name 
          }
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      // Don't try to create profile here - let the trigger handle it
      console.log('Signup successful, moving to OTP step');
      
      setIsOtpStep(true);
      toast({
        title: 'Verification Required',
        description: 'Please check your email for the verification code.'
      });
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Something went wrong during signup',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Fetch user profile from database
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const userData = {
          name: profile?.full_name || email.split('@')[0],
          email: data.user.email || email
        };

        localStorage.setItem('jarvis_user', JSON.stringify(userData));
        onLogin(userData);

        toast({
          title: 'Login Successful',
          description: 'Welcome back!'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;

      toast({
        title: 'Account Verified',
        description: 'Welcome to JARVIS!'
      });

      // Get user session and create profile if needed
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!profile && !profileError) {
          // Create profile if it doesn't exist
          await supabase
            .from('profiles')
            .insert({
              user_id: session.user.id,
              full_name: name
            });
        }

        const userData = {
          name: profile?.full_name || name || email.split('@')[0],
          email: session.user.email || email
        };

        localStorage.setItem('jarvis_user', JSON.stringify(userData));
        onLogin(userData);
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'azure') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Social Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOtpStep) {
      handleOtpVerification();
      return;
    }

    if (isSignup) {
      handleEmailSignup();
    } else {
      handleEmailLogin();
    }
  };

  if (isOtpStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Verify Your Email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* JARVIS Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            JARVIS
          </h1>
          <p className="text-muted-foreground">
            AI Voice Assistant Platform
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-primary">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignup 
                ? 'Join JARVIS to access advanced AI features' 
                : 'Sign in to continue to JARVIS'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Note about social login */}
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Social login providers need to be configured in Supabase.
                <br />Currently only email/password signup is available.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Continue with email</span>
              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && isSignup && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Password Requirements:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${passwordValidation.criteria.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.criteria.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${passwordValidation.criteria.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.criteria.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordValidation.criteria.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.criteria.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Lowercase letter
                      </div>
                      <div className={`flex items-center gap-1 ${passwordValidation.criteria.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.criteria.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Number
                      </div>
                      <div className={`flex items-center gap-1 ${passwordValidation.criteria.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.criteria.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Special character
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Remember Me & Terms */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>

                {isSignup && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      required
                    />
                    <Label htmlFor="terms" className="text-xs leading-4">
                      I agree to the{' '}
                      <button type="button" className="text-primary hover:underline">
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button type="button" className="text-primary hover:underline">
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || (isSignup && !acceptTerms)}
              >
                {isLoading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary hover:underline text-sm"
              >
                {isSignup 
                  ? 'Already have an account? Sign in' 
                  : 'New to JARVIS? Create account'
                }
              </button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Secured with enterprise-grade encryption</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};