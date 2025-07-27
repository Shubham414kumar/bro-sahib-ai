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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      setIsOtpStep(true);
      toast({
        title: 'Verification Required',
        description: 'Please check your email for the verification code.'
      });
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: 'Login Successful',
        description: 'Welcome back!'
      });

      onLogin({ name: '', email });
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

      onLogin({ name, email });
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
            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="p-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('azure')}
                disabled={isLoading}
                className="p-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0L2.1 0h9.3l.2 9.9L18.5 0H24l-8.1 8.3L24 24H16.6l-4.9-8.8L11.4 24z"/>
                </svg>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                className="p-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Contact Method Selection */}
            <div className="flex gap-2">
              <Button
                variant={contactMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setContactMethod('email')}
                className="flex-1"
                size="sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant={contactMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => setContactMethod('phone')}
                className="flex-1"
                size="sm"
              >
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </Button>
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
              
              {contactMethod === 'email' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              )}
              
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