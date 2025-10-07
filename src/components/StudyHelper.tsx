import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Brain, FileText, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StudyHelper = () => {
  const [topic, setTopic] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const language = localStorage.getItem('jarvis-language') || 'english';

  const handleStudyRequest = async (type: 'explain' | 'quiz' | 'summary') => {
    if (!topic.trim()) {
      toast({
        title: "Enter Topic",
        description: "Please enter a topic to study",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const prompts = {
        explain: `Explain this topic in simple terms: ${topic}`,
        quiz: `Create 5 quiz questions about: ${topic}`,
        summary: `Provide a brief summary of: ${topic}`
      };

      const { data, error } = await supabase.functions.invoke('openrouter-chat', {
        body: {
          messages: [{ role: 'user', content: prompts[type] }],
          language
        }
      });

      if (error) throw error;
      setResponse(data.message);
    } catch (error) {
      console.error('Study helper error:', error);
      toast({
        title: "Error",
        description: "Failed to get study help",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Helper
          </CardTitle>
          <CardDescription>Get help with learning and understanding topics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter a topic you want to learn about..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-20"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={() => handleStudyRequest('explain')}
              disabled={loading}
              variant="outline"
            >
              <Brain className="mr-2 h-4 w-4" />
              Explain
            </Button>
            <Button
              onClick={() => handleStudyRequest('quiz')}
              disabled={loading}
              variant="outline"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Quiz Me
            </Button>
            <Button
              onClick={() => handleStudyRequest('summary')}
              disabled={loading}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Summarize
            </Button>
          </div>

          {response && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyHelper;
