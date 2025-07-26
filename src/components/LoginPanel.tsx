import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LoginPanelProps {
  onLogin: (userData: { name: string; email: string }) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      // Signup validation
      if (!name || !email || !password || !confirmPassword) {
        toast({
          title: 'Error',
          description: 'Sabhi fields fill kariye',
          variant: 'destructive'
        });
        return;
      }
      
      if (password !== confirmPassword) {
        toast({
          title: 'Error', 
          description: 'Passwords match nahi kar rahe',
          variant: 'destructive'
        });
        return;
      }
      
      // Store user data in localStorage for now
      const userData = { name, email };
      localStorage.setItem('jarvis_user', JSON.stringify(userData));
      
      toast({
        title: 'Success',
        description: 'Account ban gaya! Welcome to JARVIS'
      });
      
      onLogin(userData);
    } else {
      // Login validation
      if (!email || !password) {
        toast({
          title: 'Error',
          description: 'Email aur password daaliye',
          variant: 'destructive'
        });
        return;
      }
      
      // Check if user exists in localStorage
      const storedUser = localStorage.getItem('jarvis_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        toast({
          title: 'Success',
          description: `Welcome back, ${userData.name}!`
        });
        onLogin(userData);
      } else {
        toast({
          title: 'Error',
          description: 'Account nahi mila. Pehle signup kariye',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* JARVIS Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent mb-2">
            JARVIS
          </h1>
          <p className="text-muted-foreground">
            AI Voice Assistant Access
          </p>
        </div>

        <Card className="border-jarvis-blue/20 bg-jarvis-dark-light/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-jarvis-blue">
              {isSignup ? 'Create Account' : 'Login Kariye'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignup 
                ? 'JARVIS access ke liye account banayiye' 
                : 'JARVIS ko activate karne ke liye login kariye'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Naam</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Apna naam enter kariye"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-jarvis-dark border-jarvis-blue/30 text-foreground"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-jarvis-dark border-jarvis-blue/30 text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password enter kariye"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-jarvis-dark border-jarvis-blue/30 text-foreground"
                />
              </div>
              
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Password dobara enter kariye"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-jarvis-dark border-jarvis-blue/30 text-foreground"
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                variant="default"
              >
                {isSignup ? 'Account Banayiye' : 'Login Kariye'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-jarvis-blue hover:text-jarvis-blue-light transition-colors text-sm"
              >
                {isSignup 
                  ? 'Pehle se account hai? Login kariye' 
                  : 'Naya account chahiye? Signup kariye'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};