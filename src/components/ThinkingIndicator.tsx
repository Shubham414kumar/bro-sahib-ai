import { Brain, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThinkingIndicatorProps {
  message?: string;
  language?: 'english' | 'hinglish';
}

export const ThinkingIndicator = ({ 
  message, 
  language = 'english' 
}: ThinkingIndicatorProps) => {
  const defaultMessages = {
    english: 'JARVIS is thinking...',
    hinglish: 'JARVIS soch raha hai...'
  };

  const displayMessage = message || defaultMessages[language];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card border-2 border-jarvis-blue/30 rounded-2xl p-8 shadow-2xl max-w-md mx-4"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Animated Brain Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-jarvis-blue/20 rounded-full blur-xl" />
            <Brain className="h-16 w-16 text-jarvis-blue relative z-10" />
          </motion.div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-jarvis-blue to-jarvis-blue-light bg-clip-text text-transparent">
              {displayMessage}
            </h3>
            
            {/* Animated Dots */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-jarvis-blue rounded-full"
                />
              ))}
            </div>
          </div>

          {/* Spinner */}
          <Loader2 className="h-8 w-8 text-jarvis-blue/60 animate-spin" />
        </div>
      </motion.div>
    </motion.div>
  );
};