import { JarvisAssistant } from '@/components/JarvisAssistant';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen">
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
      <JarvisAssistant />
    </div>
  );
};

export default Index;
