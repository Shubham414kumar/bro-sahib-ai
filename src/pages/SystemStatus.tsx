import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SystemStatusPanel } from '@/components/SystemStatusPanel';

const SystemStatus = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-jarvis-dark via-jarvis-dark-light to-jarvis-dark pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-jarvis-blue hover:bg-jarvis-blue/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
              System Status
            </h1>
            <p className="text-sm text-muted-foreground">Real-time system monitoring</p>
          </div>
        </div>

        {/* System Panel */}
        <div className="max-w-2xl">
          <SystemStatusPanel />
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
