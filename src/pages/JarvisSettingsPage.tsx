import { JarvisSettings } from '@/components/JarvisSettings';
import { NavigationBar } from '@/components/NavigationBar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JarvisSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-jarvis-blue/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-jarvis-blue"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-jarvis-blue">JARVIS Settings</h1>
          </div>
          <NavigationBar />
        </div>
      </div>

      <div className="pt-20 pb-8">
        <JarvisSettings />
      </div>
    </div>
  );
};

export default JarvisSettingsPage;
