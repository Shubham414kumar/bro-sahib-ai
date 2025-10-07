import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Languages } from 'lucide-react';

interface LanguageSelectorProps {
  onLanguageSelect: (language: 'english' | 'hinglish') => void;
}

const LanguageSelector = ({ onLanguageSelect }: LanguageSelectorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hinglish' | null>(null);

  const handleSelect = (language: 'english' | 'hinglish') => {
    setSelectedLanguage(language);
    localStorage.setItem('jarvis-language', language);
    setTimeout(() => {
      onLanguageSelect(language);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Languages className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Choose Your Language</CardTitle>
          <CardDescription>Select your preferred language to start</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleSelect('english')}
            variant={selectedLanguage === 'english' ? 'default' : 'outline'}
            className="w-full h-16 text-lg"
          >
            <Globe className="mr-2 h-5 w-5" />
            English
          </Button>
          <Button
            onClick={() => handleSelect('hinglish')}
            variant={selectedLanguage === 'hinglish' ? 'default' : 'outline'}
            className="w-full h-16 text-lg"
          >
            <Languages className="mr-2 h-5 w-5" />
            Hinglish (हिंग्लिश)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelector;
