import { N8nAutomation } from '@/components/N8nAutomation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const N8nAutomationPage = () => {
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
              n8n Automation
            </h1>
            <p className="text-sm text-muted-foreground">Connect JARVIS with n8n workflows</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <N8nAutomation />
        </div>
      </div>
    </div>
  );
};

export default N8nAutomationPage;
