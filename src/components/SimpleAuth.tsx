import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SimpleAuthProps {
  onLogin: (userData: { name: string; email: string }) => void;
}

export const SimpleAuth: React.FC<SimpleAuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Auth process started:', { isLogin, email, name });
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Email aur password dalno',
        variant: 'destructive'
      });
      return;
    }

    if (!isLogin && !name) {
      toast({
        title: 'Error', 
        description: 'Naam bhi dalno',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('🔑 Login attempt started');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        console.log('📊 Login response:', { 
          user: data.user?.id, 
          session: !!data.session,
          error: error?.message 
        });

        if (error) {
          console.error('❌ Login error:', error);
          throw error;
        }

        if (!data.user) {
          throw new Error('No user data received');
        }

        const userData = {
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email
        };

        console.log('✅ Login successful, user data:', userData);

        toast({
          title: 'Login Successful',
          description: 'Welcome back!'
        });

        onLogin(userData);
      } else {
        console.log('📝 Signup attempt started');
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name.trim()
            }
          }
        });

        console.log('📊 Signup response:', { 
          user: data.user?.id, 
          session: !!data.session,
          error: error?.message,
          needsConfirmation: !data.user?.email_confirmed_at
        });

        if (error) {
          console.error('❌ Signup error:', error);
          throw error;
        }

        if (!data.user) {
          throw new Error('No user data received from signup');
        }

        // For development - let's allow immediate login even without email confirmation
        const userData = {
          name: name.trim(),
          email: email.trim()
        };

        console.log('✅ Signup successful, user data:', userData);

        if (data.user.email_confirmed_at) {
          // User is automatically confirmed
          toast({
            title: 'Account Created',
            description: 'Welcome to JARVIS!'
          });
          onLogin(userData);
        } else {
          // Email confirmation required - but for demo purposes, let's proceed
          toast({
            title: 'Account Created', 
            description: 'Welcome to JARVIS! (Demo mode - no email verification needed)'
          });
          
          // For demo, directly login the user
          setTimeout(() => {
            onLogin(userData);
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('💥 Auth error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      let message = 'Kuch problem hai';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Wrong email ya password hai';
      } else if (error.message?.includes('User already registered')) {
        message = 'Email already registered hai. Login try karo.';
      } else if (error.message?.includes('Failed to fetch')) {
        message = 'Internet connection check karo';
      } else if (error.message?.includes('Database')) {
        message = 'Database connection issue hai';
      } else if (error.message) {
        message = error.message;
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Auth process completed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-primary">
            {isLogin ? 'Login' : 'Sign Up'}
          </CardTitle>
          <CardDescription className="text-center">
            JARVIS AI Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm"
            >
              {isLogin ? 'New user? Sign up' : 'Already have account? Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
