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
        console.log('🔑 Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          console.error('❌ Login error:', error);
          throw error;
        }

        console.log('✅ Login successful:', data.user?.id);
        
        const userData = {
          name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User',
          email: data.user?.email || email
        };

        toast({
          title: 'Login Successful',
          description: 'Welcome back!'
        });

        onLogin(userData);
      } else {
        console.log('📝 Attempting signup...');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name.trim()
            }
          }
        });

        if (error) {
          console.error('❌ Signup error:', error);
          throw error;
        }

        console.log('✅ Signup successful:', data.user?.id);
        
        if (data.user && data.user.email_confirmed_at) {
          // User is automatically confirmed
          const userData = {
            name: name.trim(),
            email: email.trim()
          };

          toast({
            title: 'Account Created',
            description: 'Welcome to JARVIS!'
          });

          onLogin(userData);
        } else {
          // Email confirmation required
          toast({
            title: 'Check Email',
            description: 'Email verification link bheja gaya hai'
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let message = 'Something went wrong';
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Wrong email ya password';
      } else if (error.message?.includes('User already registered')) {
        message = 'Email already registered hai. Login try karo.';
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