import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Create a new Supabase client to avoid any initialization issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ohigiedhjuqdlbohvssp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWdpZWRoanVxZGxib2h2c3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Mjc0OTEsImV4cCI6MjA2OTEwMzQ5MX0.l2WZxLVdDoqEgYEOFxZNz8IfLVoYFyI4a9rhJc5DAM8";

const authClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

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

  useEffect(() => {
    // Clean up any existing auth state
    const cleanAuthState = () => {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    };
    
    cleanAuthState();
    console.log('🧹 Auth state cleaned');
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Starting auth with fresh client');
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: 'Required Fields',
        description: 'Email aur password dalno',
        variant: 'destructive'
      });
      return;
    }

    if (!isLogin && !name.trim()) {
      toast({
        title: 'Required Fields', 
        description: 'Naam bhi dalno',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Force signout any existing session first
      try {
        await authClient.auth.signOut({ scope: 'global' });
      } catch (signoutError) {
        console.log('Signout error (ignoring):', signoutError);
      }

      if (isLogin) {
        console.log('🔑 Attempting login...');
        
        const { data, error } = await authClient.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          console.error('❌ Login failed:', error);
          throw error;
        }

        if (!data.user) {
          throw new Error('No user returned');
        }

        const userData = {
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email.trim()
        };

        console.log('✅ Login success');
        
        toast({
          title: 'Success',
          description: 'Login ho gaya!'
        });

        // Small delay to ensure state is updated
        setTimeout(() => {
          onLogin(userData);
        }, 100);

      } else {
        console.log('📝 Attempting signup...');
        
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await authClient.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: name.trim()
            },
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          console.error('❌ Signup failed:', error);
          throw error;
        }

        if (!data.user) {
          throw new Error('No user returned from signup');
        }

        const userData = {
          name: name.trim(),
          email: email.trim()
        };

        console.log('✅ Signup success');

        toast({
          title: 'Success',
          description: 'Account ban gaya!'
        });

        // For demo purposes, proceed without email confirmation
        setTimeout(() => {
          onLogin(userData);
        }, 100);
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      
      let message = 'Something went wrong';
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Wrong email ya password';
      } else if (error.message?.includes('already registered')) {
        message = 'Email already exists. Login karo.';
      } else if (error.message?.includes('fetch')) {
        message = 'Network error - internet check karo';
      } else if (error.code === 'invalid_credentials') {
        message = 'Email ya password galat hai';
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
