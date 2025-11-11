import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Trash2, Edit, Save, X, Plus, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MemoryService, UserMemory, ConversationSummary } from '@/services/MemoryService';

const MemoryDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [mems, sums] = await Promise.all([
      MemoryService.getAllMemories(user.id),
      MemoryService.getRecentSummaries(user.id, 10)
    ]);
    setMemories(mems);
    setSummaries(sums);
    setLoading(false);
  };

  const handleDelete = async (key: string) => {
    if (!user?.id) return;
    const success = await MemoryService.deleteMemory(user.id, key);
    if (success) {
      toast({ title: 'Memory deleted' });
      loadData();
    }
  };

  const handleEdit = (memory: UserMemory) => {
    setEditingId(memory.id || '');
    setEditValue(memory.memory_value);
  };

  const handleSaveEdit = async (memory: UserMemory) => {
    if (!user?.id) return;
    const success = await MemoryService.saveMemory(
      user.id,
      memory.memory_key,
      editValue,
      memory.category
    );
    if (success) {
      toast({ title: 'Memory updated' });
      setEditingId(null);
      loadData();
    }
  };

  const handleAddNew = async () => {
    if (!user?.id || !newKey || !newValue) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    const success = await MemoryService.saveMemory(user.id, newKey, newValue, newCategory);
    if (success) {
      toast({ title: 'Memory added' });
      setNewKey('');
      setNewValue('');
      setNewCategory('general');
      loadData();
    }
  };

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
              Memory Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Manage JARVIS's memory of you</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Add New Memory */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-jarvis-blue" />
              <h2 className="text-xl font-semibold">Add New Memory</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Memory Key</Label>
                <Input
                  placeholder="e.g., favorite_color, work_role"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="bg-background/50 border-jarvis-blue/20"
                />
              </div>
              <div>
                <Label>Memory Value</Label>
                <Textarea
                  placeholder="e.g., Blue, Software Engineer"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="bg-background/50 border-jarvis-blue/20"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="general, preferences, work"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-background/50 border-jarvis-blue/20"
                />
              </div>
              <Button onClick={handleAddNew} className="bg-jarvis-blue hover:bg-jarvis-blue/80">
                <Plus className="h-4 w-4 mr-2" />
                Add Memory
              </Button>
            </div>
          </Card>

          {/* Stored Memories */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-jarvis-blue" />
              <h2 className="text-xl font-semibold">Stored Memories ({memories.length})</h2>
            </div>
            <ScrollArea className="h-[400px]">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : memories.length === 0 ? (
                <p className="text-muted-foreground">No memories stored yet</p>
              ) : (
                <div className="space-y-3">
                  {memories.map((mem) => (
                    <Card key={mem.id} className="p-4 bg-background/30">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-jarvis-blue/30 text-jarvis-blue">
                              {mem.category}
                            </Badge>
                            <span className="text-sm font-semibold">{mem.memory_key}</span>
                          </div>
                          {editingId === mem.id ? (
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="mb-2 bg-background/50 border-jarvis-blue/20"
                            />
                          ) : (
                            <p className="text-muted-foreground">{mem.memory_value}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Updated: {new Date(mem.updated_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {editingId === mem.id ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSaveEdit(mem)}
                                className="text-green-500 hover:bg-green-500/10"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                className="text-muted-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(mem)}
                                className="text-jarvis-blue hover:bg-jarvis-blue/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(mem.memory_key)}
                                className="text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Conversation Summaries */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
            <h2 className="text-xl font-semibold mb-4">Conversation Summaries ({summaries.length})</h2>
            <ScrollArea className="h-[300px]">
              {summaries.length === 0 ? (
                <p className="text-muted-foreground">No conversation summaries yet</p>
              ) : (
                <div className="space-y-3">
                  {summaries.map((sum) => (
                    <Card key={sum.id} className="p-4 bg-background/30">
                      <p className="text-sm mb-2">{sum.summary}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{sum.message_count} messages</span>
                        <span>{new Date(sum.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemoryDashboard;
