import { JarvisAssistant } from '@/components/JarvisAssistant';
import { NavigationBar } from '@/components/NavigationBar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-jarvis-blue/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NavigationBar />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">{user?.email}</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-red-400"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-16 pb-20 md:pb-8">
        <JarvisAssistant />
      </div>
    </div>
  );
};

export default Index;
