import { JarvisAssistant } from '@/components/JarvisAssistant';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/payment')}
          className="gap-2"
        >
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Upgrade</span>
        </Button>
        <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign Out
        </Button>
      </div>
      <JarvisAssistant />
    </div>
  );
};

export default Index;
