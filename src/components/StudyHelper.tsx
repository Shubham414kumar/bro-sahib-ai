import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Brain, FileText, HelpCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

const StudyHelper = () => {
  const [topic, setTopic] = useState('');
  const [response, setResponse] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const language = localStorage.getItem('jarvis-language') || 'english';

  const detectLanguage = (text: string): 'english' | 'hindi' | 'hinglish' => {
    const hindiPattern = /[\u0900-\u097F]/;
    const hasHindi = hindiPattern.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasHindi && hasEnglish) return 'hinglish';
    if (hasHindi) return 'hindi';
    return 'english';
  };

  const handleStudyRequest = async (type: 'explain' | 'quiz' | 'summary') => {
    if (!topic.trim()) {
      const emptyMessages = {
        english: 'Please enter a topic to study',
        hindi: 'कृपया अध्ययन के लिए एक विषय दर्ज करें',
        hinglish: 'Please topic enter karo study karne ke liye'
      };
      
      toast({
        title: type === 'explain' ? 'Enter Topic' : type === 'quiz' ? 'Enter Topic for Quiz' : 'Enter Topic to Summarize',
        description: emptyMessages[language as keyof typeof emptyMessages] || emptyMessages.english,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResponse('');
    setQuizQuestions([]);
    setShowAnswers(false);
    
    try {
      const detectedLang = detectLanguage(topic);
      const requestLanguage = detectedLang === 'hindi' ? 'hindi' : detectedLang === 'hinglish' ? 'hinglish' : 'english';
      
      const prompts = {
        explain: {
          english: `Explain this topic in clear detail with 2-3 paragraphs like a friendly study partner: ${topic}`,
          hindi: `इस विषय को 2-3 पैराग्राफ में विस्तार से समझाएं जैसे एक दोस्त समझाता है: ${topic}`,
          hinglish: `Is topic ko detail mein explain karo 2-3 paragraphs mein, friendly tone mein: ${topic}`
        },
        quiz: {
          english: `Generate 5-10 multiple choice questions about: ${topic}. Format each as:
Q1. [Question]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
✅ Correct: [A/B/C/D]`,
          hindi: `इस विषय पर 5-10 बहुविकल्पीय प्रश्न बनाएं: ${topic}। प्रत्येक को इस प्रकार फॉर्मेट करें:
Q1. [प्रश्न]
A. [विकल्प A]
B. [विकल्प B]
C. [विकल्प C]
D. [विकल्प D]
✅ सही: [A/B/C/D]`,
          hinglish: `Is topic ke baare mein 5-10 MCQ questions banao: ${topic}. Har ek ko aise format karo:
Q1. [Question]
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
✅ Correct: [A/B/C/D]`
        },
        summary: {
          english: `Provide a concise 3-4 line summary of: ${topic}`,
          hindi: `इसका संक्षिप्त 3-4 पंक्तियों का सारांश प्रदान करें: ${topic}`,
          hinglish: `Is topic ka 3-4 lines mein short summary do: ${topic}`
        }
      };

      const loadingMessages = {
        explain: {
          english: 'Fetching explanation...',
          hindi: 'व्याख्या प्राप्त की जा रही है...',
          hinglish: 'Explanation fetch ho raha hai...'
        },
        quiz: {
          english: 'Generating quiz questions...',
          hindi: 'क्विज प्रश्न बनाए जा रहे हैं...',
          hinglish: 'Quiz questions ban rahe hain...'
        },
        summary: {
          english: 'Creating summary...',
          hindi: 'सारांश बनाया जा रहा है...',
          hinglish: 'Summary ban raha hai...'
        }
      };

      toast({
        title: type === 'explain' ? 'Explain' : type === 'quiz' ? 'Quiz Me' : 'Summarize',
        description: loadingMessages[type][requestLanguage as keyof typeof loadingMessages.explain] || loadingMessages[type].english,
      });

      const { data, error } = await supabase.functions.invoke('openrouter-chat', {
        body: {
          messages: [{ 
            role: 'user', 
            content: prompts[type][requestLanguage as keyof typeof prompts.explain] || prompts[type].english 
          }],
          language: requestLanguage
        }
      });

      if (error) {
        console.error('Study helper API error:', error);
        throw error;
      }
      
      if (data?.message) {
        setResponse(data.message);
        
        // Parse quiz questions if quiz type
        if (type === 'quiz') {
          const questions = parseQuizQuestions(data.message);
          setQuizQuestions(questions);
        }

        toast({
          title: 'Success',
          description: type === 'explain' ? 'Explanation ready!' : type === 'quiz' ? 'Quiz generated!' : 'Summary ready!',
        });
      } else {
        throw new Error('No response from AI');
      }
    } catch (error: any) {
      console.error('Study helper error:', error);
      
      const errorMessages = {
        english: 'Sorry bro, study help is not available right now. Try again later.',
        hindi: 'क्षमा करें भाई, अभी अध्ययन सहायता उपलब्ध नहीं है। बाद में पुनः प्रयास करें।',
        hinglish: 'Sorry bro, abhi study help available nahi hai. Baad mein try karo.'
      };
      
      // Check for specific error types
      let errorDescription = errorMessages[language as keyof typeof errorMessages] || errorMessages.english;
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorDescription = language === 'hinglish' 
          ? 'Rate limit exceed ho gaya. Thoda wait karo aur phir try karo.'
          : language === 'hindi'
          ? 'रेट लिमिट पार हो गई। थोड़ा इंतजार करें और फिर कोशिश करें।'
          : 'Rate limit exceeded. Please wait a moment and try again.';
      }
      
      toast({
        title: "Error",
        description: errorDescription,
        variant: "destructive"
      });
      
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  const parseQuizQuestions = (text: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    const questionBlocks = text.split(/Q\d+\./i).filter(block => block.trim());
    
    questionBlocks.forEach(block => {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length < 5) return;
      
      const question = lines[0].trim();
      const options: string[] = [];
      let correctAnswer = '';
      
      lines.forEach(line => {
        if (line.match(/^[A-D]\./)) {
          options.push(line.trim());
        }
        if (line.includes('✅') || line.toLowerCase().includes('correct')) {
          const match = line.match(/[A-D]/i);
          if (match) correctAnswer = match[0].toUpperCase();
        }
      });
      
      if (question && options.length === 4 && correctAnswer) {
        questions.push({ question, options, correctAnswer });
      }
    });
    
    return questions;
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-4xl">
      <Card className="border-jarvis-blue/30 bg-jarvis-dark-light/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-jarvis-blue">
            <BookOpen className="h-5 w-5" />
            Study Helper
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {language === 'hinglish' 
              ? 'Learning aur topics samajhne mein help chahiye?' 
              : language === 'hindi'
              ? 'सीखने और विषयों को समझने में मदद चाहिए?'
              : 'Get help with learning and understanding topics'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={
              language === 'hinglish' 
                ? 'Vo topic enter karo jo seekhna hai...' 
                : language === 'hindi'
                ? 'वह विषय दर्ज करें जो सीखना है...'
                : 'Enter a topic you want to learn about...'
            }
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-20 bg-background/50 border-jarvis-blue/20 focus:border-jarvis-blue"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={() => handleStudyRequest('explain')}
              disabled={loading}
              variant="outline"
              className="border-jarvis-blue/50 hover:bg-jarvis-blue/10"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              {language === 'hinglish' ? 'Explain Karo' : language === 'hindi' ? 'समझाएं' : 'Explain'}
            </Button>
            <Button
              onClick={() => handleStudyRequest('quiz')}
              disabled={loading}
              variant="outline"
              className="border-jarvis-blue/50 hover:bg-jarvis-blue/10"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="mr-2 h-4 w-4" />
              )}
              {language === 'hinglish' ? 'Quiz Banao' : language === 'hindi' ? 'क्विज बनाएं' : 'Quiz Me'}
            </Button>
            <Button
              onClick={() => handleStudyRequest('summary')}
              disabled={loading}
              variant="outline"
              className="border-jarvis-blue/50 hover:bg-jarvis-blue/10"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {language === 'hinglish' ? 'Summary Do' : language === 'hindi' ? 'सारांश दें' : 'Summarize'}
            </Button>
          </div>

          {response && quizQuestions.length === 0 && (
            <Card className="bg-muted/50 border-jarvis-blue/20">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{response}</pre>
              </CardContent>
            </Card>
          )}

          {quizQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-jarvis-blue">
                  {language === 'hinglish' ? 'Quiz Questions' : language === 'hindi' ? 'क्विज प्रश्न' : 'Quiz Questions'}
                </h3>
                <Button
                  onClick={() => setShowAnswers(!showAnswers)}
                  variant="outline"
                  size="sm"
                  className="border-jarvis-blue/50"
                >
                  {showAnswers 
                    ? (language === 'hinglish' ? 'Answers Chhupao' : language === 'hindi' ? 'उत्तर छुपाएं' : 'Hide Answers')
                    : (language === 'hinglish' ? 'Answers Dikhao' : language === 'hindi' ? 'उत्तर दिखाएं' : 'Show Answers')}
                </Button>
              </div>
              
              {quizQuestions.map((q, index) => (
                <Card key={index} className="bg-muted/30 border-jarvis-blue/20">
                  <CardContent className="pt-6 space-y-3">
                    <p className="font-semibold text-foreground">
                      Q{index + 1}. {q.question}
                    </p>
                    <div className="space-y-2 pl-4">
                      {q.options.map((option, optIndex) => {
                        const optionLetter = option.charAt(0);
                        const isCorrect = showAnswers && optionLetter === q.correctAnswer;
                        return (
                          <p 
                            key={optIndex} 
                            className={`text-sm ${isCorrect ? 'text-green-500 font-semibold' : 'text-muted-foreground'}`}
                          >
                            {option} {isCorrect && '✅'}
                          </p>
                        );
                      })}
                    </div>
                    {showAnswers && (
                      <p className="text-sm text-green-500 font-semibold pt-2">
                        ✅ {language === 'hinglish' ? 'Sahi Jawab' : language === 'hindi' ? 'सही उत्तर' : 'Correct Answer'}: {q.correctAnswer}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyHelper;
