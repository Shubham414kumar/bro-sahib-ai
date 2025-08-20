import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface FreshAuthPanelProps {
  onLogin: (userData: { name: string; email: string }) => void;
}

export const FreshAuthPanel: React.FC<FreshAuthPanelProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateInputs = () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Email address chahiye',
        variant: 'destructive'
      });
      return false;
    }

    if (!password.trim()) {
      toast({
        title: 'Error', 
        description: 'Password dalno',
        variant: 'destructive'
      });
      return false;
    }

    if (isSignUp && !fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Apna naam bhi dalno',
        variant: 'destructive'
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password kam se kam 6 characters ka hona chahiye',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim()
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: 'Success!',
            description: 'Account ban gaya! Login kar sakte hain ab.'
          });
          
          // Switch to login mode
          setIsSignUp(false);
          setPassword('');
          setFullName('');
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;

        if (data.user) {
          const userData = {
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email.trim()
          };

          toast({
            title: 'Welcome!',
            description: `Hello ${userData.name}! JARVIS ready hai.`
          });

          onLogin(userData);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let message = 'Kuch galat ho gaya';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ya password galat hai';
      } else if (error.message?.includes('already registered')) {
        message = 'Email already exist karta hai. Login karo.';
      } else if (error.message?.includes('User already registered')) {
        message = 'User already registered hai. Login karo.';
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Email confirm nahi hai. Check your inbox.';
      } else if (error.message?.includes('fetch')) {
        message = 'Internet connection check karo';
      } else {
        message = error.message || 'Unknown error';
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-blue-500/20 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {isSignUp ? 'Join JARVIS' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isSignUp ? 'Create your JARVIS account' : 'Sign in to your JARVIS assistant'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-200">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required={isSignUp}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setFullName('');
                }}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                {isSignUp 
                  ? 'Already have account? Sign in' 
                  : "Don't have account? Sign up"
                }
              </button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-4">
          <p className="text-slate-400 text-xs">
            Powered by JARVIS AI Assistant
          </p>
        </div>
      </div>
    </div>
  );
};