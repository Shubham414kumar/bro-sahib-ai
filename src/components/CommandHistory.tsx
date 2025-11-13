import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trash2, Download, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';

interface CommandHistoryItem {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  language: string;
}

interface CommandHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRerun?: (command: string) => void;
}

export const CommandHistory = ({ isOpen, onClose, onRerun }: CommandHistoryProps) => {
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, [isOpen]);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('jarvis-command-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load command history:', error);
    }
  };

  const saveHistory = (newHistory: CommandHistoryItem[]) => {
    try {
      localStorage.setItem('jarvis-command-history', JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('Failed to save command history:', error);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('jarvis-command-history');
    setHistory([]);
  };

  const exportHistory = () => {
    const text = history.map(item => 
      `[${item.timestamp.toLocaleString()}]\nCommand: ${item.command}\nResponse: ${item.response}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(item =>
    item.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.response.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-card border-l-2 border-jarvis-blue/30 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-jarvis-blue/20 bg-gradient-to-r from-jarvis-blue/10 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <History className="h-6 w-6 text-jarvis-blue" />
                    <h2 className="text-2xl font-bold text-jarvis-blue">Command History</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-background/50 border border-jarvis-blue/20 rounded-lg focus:outline-none focus:border-jarvis-blue/50 text-foreground"
                />

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportHistory}
                    disabled={history.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* History List */}
              <ScrollArea className="flex-1 p-6">
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <History className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg">
                      {searchTerm ? 'No matching commands found' : 'No command history yet'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm ? 'Try a different search term' : 'Start talking to JARVIS to see your commands here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.slice(0, 10).map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                      >
                        <Card className="p-4 bg-card/50 border-jarvis-blue/20 hover:border-jarvis-blue/40 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Timestamp */}
                              <p className="text-xs text-muted-foreground">
                                {item.timestamp.toLocaleString()}
                              </p>

                              {/* Command */}
                              <div className="bg-jarvis-blue/10 rounded-lg p-3 border border-jarvis-blue/20">
                                <p className="text-sm font-medium text-jarvis-blue mb-1">You:</p>
                                <p className="text-foreground">{item.command}</p>
                              </div>

                              {/* Response */}
                              <div className="bg-background/50 rounded-lg p-3 border border-border">
                                <p className="text-sm font-medium text-jarvis-blue mb-1">JARVIS:</p>
                                <p className="text-muted-foreground text-sm line-clamp-3">
                                  {item.response}
                                </p>
                              </div>
                            </div>

                            {/* Rerun Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRerun?.(item.command)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Re-run this command"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Export function to add command to history
export const addToCommandHistory = (command: string, response: string, language: string = 'english') => {
  try {
    const stored = localStorage.getItem('jarvis-command-history');
    const history: CommandHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    const newItem: CommandHistoryItem = {
      id: Date.now().toString(),
      command,
      response,
      timestamp: new Date(),
      language
    };

    // Keep only last 50 items
    const updatedHistory = [newItem, ...history].slice(0, 50);
    localStorage.setItem('jarvis-command-history', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to add to command history:', error);
  }
};
