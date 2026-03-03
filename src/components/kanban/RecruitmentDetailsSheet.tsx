import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRecruitmentInteractions, type RecruitmentInteraction } from '@/hooks/useRecruitmentInteractions';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Mail, MessageCircle, Users, FileText, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RecruitmentCardLead } from './RecruitmentKanbanCard';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: RecruitmentCardLead | null;
  agencyId?: string;
  onSave: (leadId: string, updates: Record<string, any>) => void;
  onDelete: (leadId: string) => void;
}

const experienceLevels = [
  { value: 'com_experiencia', label: 'Com Experiência' },
  { value: 'sem_experiencia', label: 'Sem Experiência' },
];

const tempOptions = [
  { value: 'hot', label: 'Quente' },
  { value: 'warm', label: 'Morno' },
  { value: 'cold', label: 'Frio' },
];

const interactionTypes = [
  { value: 'call', label: 'Chamada', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'other', label: 'Outro', icon: FileText },
];

export function RecruitmentDetailsSheet({ open, onOpenChange, lead, agencyId, onSave, onDelete }: Props) {
  const { user } = useAuth();
  const { interactions, addInteraction } = useRecruitmentInteractions(lead?.id);
  const { tasks, addTask, updateTask } = useLeadTasks(lead?.id);

  const [form, setForm] = useState({
    experience_level: '',
    cv_url: '',
    next_action_text: '',
    next_action_at: '',
    temperature: 'warm',
  });

  const [interactionNote, setInteractionNote] = useState('');

  useEffect(() => {
    if (lead) {
      setForm({
        experience_level: lead.experienceLevel || '',
        cv_url: lead.cvUrl || '',
        next_action_text: lead.nextActionText || '',
        next_action_at: lead.nextActionAt ? new Date(lead.nextActionAt).toISOString().slice(0, 10) : '',
        temperature: lead.temperature || 'warm',
      });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    onSave(lead.id, {
      experience_level: form.experience_level || null,
      cv_url: form.cv_url || null,
      next_action_text: form.next_action_text || null,
      next_action_at: form.next_action_at || null,
      temperature: form.temperature,
    });
    toast.success('Candidato atualizado');
  };

  const handleAddInteraction = (type: string) => {
    if (!agencyId) return;
    addInteraction.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      type,
      note: interactionNote || undefined,
    });
    setInteractionNote('');
    toast.success('Interação registada');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{lead.clientName}</SheetTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                <Phone className="h-3 w-3" /> {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                <Mail className="h-3 w-3" /> {lead.email}
              </a>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="dados" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
            <TabsTrigger value="tarefas" className="flex-1">Tarefas</TabsTrigger>
          </TabsList>

          {/* DADOS TAB */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Informação do Candidato</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Experiência</Label>
                  <Select value={form.experience_level} onValueChange={v => setForm(f => ({ ...f, experience_level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Temperatura</Label>
                  <Select value={form.temperature} onValueChange={v => setForm(f => ({ ...f, temperature: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tempOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">CV (URL)</Label>
                <Input value={form.cv_url} onChange={e => setForm(f => ({ ...f, cv_url: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Próxima Ação</Label>
                  <Input value={form.next_action_text} onChange={e => setForm(f => ({ ...f, next_action_text: e.target.value }))} placeholder="Descrição" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={form.next_action_at} onChange={e => setForm(f => ({ ...f, next_action_at: e.target.value }))} />
                </div>
              </div>

              {lead.source && (
                <div className="space-y-1">
                  <Label className="text-xs">Origem</Label>
                  <Input value={lead.source} disabled className="bg-muted" />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">Guardar</Button>
              <Button variant="destructive" size="icon" onClick={() => { onDelete(lead.id); onOpenChange(false); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* HISTÓRICO TAB */}
          <TabsContent value="historico" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs">Nota (opcional)</Label>
              <Textarea value={interactionNote} onChange={e => setInteractionNote(e.target.value)} placeholder="Descrição do contacto..." rows={2} />
            </div>
            <div className="flex flex-wrap gap-2">
              {interactionTypes.map(it => (
                <Button key={it.value} variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleAddInteraction(it.value)}>
                  <it.icon className="h-3 w-3" /> {it.label}
                </Button>
              ))}
            </div>

            <Separator />

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {interactions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sem interações registadas</p>
              ) : (
                interactions.map((i: RecruitmentInteraction) => (
                  <div key={i.id} className="flex gap-3 text-xs border-l-2 border-border pl-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{i.type}</Badge>
                        <span className="text-muted-foreground">{i.creator_name}</span>
                      </div>
                      {i.note && <p className="mt-1 text-muted-foreground">{i.note}</p>}
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(i.created_at).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAREFAS TAB */}
          <TabsContent value="tarefas" className="space-y-3 mt-4">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem tarefas</p>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 text-xs border rounded-md p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'pending' : 'done' })}
                  >
                    <CheckCircle className={`h-4 w-4 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                    {task.due_date && (
                      <span className="block text-muted-foreground">{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
