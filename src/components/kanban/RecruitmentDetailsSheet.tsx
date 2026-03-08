import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRecruitmentInteractions, type RecruitmentInteraction } from '@/hooks/useRecruitmentInteractions';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Mail, MessageCircle, Users, FileText, Trash2, CheckCircle, CalendarIcon, MapPin, Plus, StickyNote, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

const tempButtons = [
  { value: 'hot', label: '🔥 Quente', active: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'warm', label: '☀️ Morno', active: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'cold', label: '❄️ Frio', active: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: '', label: '○ Indefinido', active: 'bg-muted text-muted-foreground border-border' },
];

const sourceOptions = [
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'referencia', label: '👥 Referência' },
  { value: 'website', label: '🌐 Website' },
  { value: 'facebook', label: '📱 Facebook' },
  { value: 'idealista', label: '🏠 Idealista' },
  { value: 'redes_sociais', label: '🤝 Redes Sociais' },
  { value: 'walkin', label: '🚶 Walk-in' },
  { value: 'evento', label: '🎪 Evento' },
  { value: 'outro', label: '📋 Outro' },
];

const motivationOptions = [
  { value: 'progressao_carreira', label: 'Progressão de carreira' },
  { value: 'maior_rendimento', label: 'Maior rendimento' },
  { value: 'reconversao', label: 'Reconversão profissional' },
  { value: 'desempregado', label: 'Desempregado' },
  { value: 'empreendedorismo', label: 'Empreendedorismo' },
  { value: 'outro', label: 'Outro' },
];

const pipelineColumns: Record<string, string> = {
  'novo-lead': 'Novo Lead',
  'contactado': 'Contactado',
  'entrevista-agendada': 'Entrevista Agendada',
  'entrevistado': 'Entrevistado',
  'em-decisao': 'Em Decisão',
  'integrado': 'Integrado',
  'nao-avancou': 'Não Avançou',
};

const interactionTypeLabels: Record<string, { emoji: string; label: string }> = {
  call: { emoji: '📞', label: 'Chamada' },
  whatsapp: { emoji: '💬', label: 'WhatsApp' },
  email: { emoji: '📧', label: 'Email' },
  meeting: { emoji: '🤝', label: 'Reunião' },
  note: { emoji: '📝', label: 'Nota' },
  stage_change: { emoji: '➡️', label: 'Mudança de etapa' },
  other: { emoji: '📄', label: 'Outro' },
};

const interactionButtons = [
  { value: 'call', label: 'Chamada', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function cleanPhone(phone?: string) {
  return phone?.replace(/\s+/g, '').replace(/^00/, '+') || '';
}

export function RecruitmentDetailsSheet({ open, onOpenChange, lead, agencyId, onSave, onDelete }: Props) {
  const { user } = useAuth();
  const { interactions, addInteraction } = useRecruitmentInteractions(lead?.id);
  const { tasks, addTask, updateTask, deleteTask } = useLeadTasks(lead?.id);

  const [form, setForm] = useState({
    experience_level: '',
    cv_url: '',
    next_action_text: '',
    next_action_at: '',
    temperature: 'warm',
    source: '',
    candidate_profession: '',
    candidate_zone: '',
    candidate_motivation: '',
    candidate_notes: '',
  });

  const [interactionNote, setInteractionNote] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [taskCalendarOpen, setTaskCalendarOpen] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        experience_level: lead.experienceLevel || '',
        cv_url: lead.cvUrl || '',
        next_action_text: lead.nextActionText || '',
        next_action_at: lead.nextActionAt ? new Date(lead.nextActionAt).toISOString().slice(0, 10) : '',
        temperature: lead.temperature || 'warm',
        source: lead.source || '',
        candidate_profession: lead.candidateProfession || '',
        candidate_zone: lead.candidateZone || '',
        candidate_motivation: lead.candidateMotivation || '',
        candidate_notes: lead.candidateNotes || '',
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
      temperature: form.temperature || 'warm',
      source: form.source || null,
      candidate_profession: form.candidate_profession || null,
      candidate_zone: form.candidate_zone || null,
      candidate_motivation: form.candidate_motivation || null,
      candidate_notes: form.candidate_notes || null,
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

  const handleAddNote = () => {
    if (!agencyId || !interactionNote.trim()) {
      toast.error('Escreve uma nota primeiro');
      return;
    }
    addInteraction.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      type: 'note',
      note: interactionNote,
    });
    setInteractionNote('');
    toast.success('Nota adicionada');
  };

  const handleAddTask = () => {
    if (!agencyId || !newTaskTitle.trim()) return;
    addTask.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      title: newTaskTitle.trim(),
      due_date: newTaskDate || undefined,
    });
    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const selectedDate = form.next_action_at ? new Date(form.next_action_at) : undefined;
  const taskSelectedDate = newTaskDate ? new Date(newTaskDate) : undefined;
  const phoneClean = cleanPhone(lead.phone);
  const columnLabel = pipelineColumns[lead.columnId] || lead.columnId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header com avatar + botões */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {getInitials(lead.clientName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{lead.clientName}</h2>
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0 shrink-0">
                  Recrutamento
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {lead.phone && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-3 w-3" /> Ligar
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  </Button>
                )}
                {phoneClean && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50" asChild>
                    <a href={`https://wa.me/${phoneClean.replace('+', '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dados" className="px-6 pb-6">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
            <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
            <TabsTrigger value="tarefas" className="flex-1">Tarefas</TabsTrigger>
          </TabsList>

          {/* DADOS TAB */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            {/* Badge etapa pipeline */}
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <MapPin className="h-3 w-3" /> {columnLabel}
            </Badge>

            {/* Temperatura */}
            <div className="space-y-1">
              <Label className="text-xs">Temperatura</Label>
              <div className="flex gap-1.5 flex-wrap">
                {tempButtons.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                      form.temperature === t.value
                        ? t.active
                        : 'bg-background text-muted-foreground border-border hover:bg-muted/50',
                    )}
                    onClick={() => setForm(f => ({ ...f, temperature: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Próxima Ação + Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Próxima Ação</Label>
                <Input value={form.next_action_text} onChange={e => setForm(f => ({ ...f, next_action_text: e.target.value }))} placeholder="Descrição" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-10',
                        !selectedDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "d 'de' MMMM yyyy", { locale: pt })
                        : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setForm(f => ({ ...f, next_action_at: date ? format(date, 'yyyy-MM-dd') : '' }));
                        setCalendarOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Informação do Candidato */}
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
                <Label className="text-xs">Origem</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar origem..." /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Profissão atual</Label>
                <Input
                  value={form.candidate_profession}
                  onChange={e => setForm(f => ({ ...f, candidate_profession: e.target.value }))}
                  placeholder="Ex: Assistente Comercial"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Zona geográfica</Label>
                <Input
                  value={form.candidate_zone}
                  onChange={e => setForm(f => ({ ...f, candidate_zone: e.target.value }))}
                  placeholder="Ex: Braga, Guimarães"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Motivação</Label>
              <Select value={form.candidate_motivation} onValueChange={v => setForm(f => ({ ...f, candidate_motivation: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar motivação" /></SelectTrigger>
                <SelectContent>
                  {motivationOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notas iniciais</Label>
              <Textarea
                value={form.candidate_notes}
                onChange={e => setForm(f => ({ ...f, candidate_notes: e.target.value }))}
                placeholder="Observações sobre o candidato..."
                rows={3}
              />
            </div>

            <Separator />

            {/* CV */}
            <div className="space-y-1">
              <Label className="text-xs">CV (URL)</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={form.cv_url}
                  onChange={e => setForm(f => ({ ...f, cv_url: e.target.value }))}
                  placeholder="Cole o link do CV (Google Drive, Dropbox...)"
                />
                {form.cv_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => window.open(form.cv_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Partilha o ficheiro com permissão "qualquer pessoa com o link pode ver" antes de colar aqui
              </p>
            </div>

            {/* Botões Guardar + Eliminar */}
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
              <Label className="text-xs">Nota / descrição do contacto</Label>
              <Textarea value={interactionNote} onChange={e => setInteractionNote(e.target.value)} placeholder="Descrição do contacto..." rows={2} />
            </div>
            <div className="flex flex-wrap gap-2">
              {interactionButtons.map(it => (
                <Button key={it.value} variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleAddInteraction(it.value)}>
                  <it.icon className="h-3 w-3" /> {it.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="gap-1 text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleAddNote}>
                <StickyNote className="h-3 w-3" /> + Nota
              </Button>
            </div>

            <Separator />

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {interactions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sem interações registadas</p>
              ) : (
                interactions.map((i: RecruitmentInteraction) => {
                  const typeInfo = interactionTypeLabels[i.type] || { emoji: '📄', label: i.type };
                  return (
                    <div key={i.id} className="flex gap-3 text-xs border-l-2 border-border pl-3 py-1">
                      <span className="text-base shrink-0 leading-none mt-0.5">{typeInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{typeInfo.label}</Badge>
                          <span className="text-muted-foreground">{i.creator_name}</span>
                        </div>
                        {i.note && <p className="mt-1 text-muted-foreground">{i.note}</p>}
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(i.created_at), { addSuffix: true, locale: pt })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAREFAS TAB */}
          <TabsContent value="tarefas" className="space-y-3 mt-4">
            {/* Nova tarefa inline */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Nova tarefa..."
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <Popover open={taskCalendarOpen} onOpenChange={setTaskCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={taskSelectedDate}
                    onSelect={(date) => {
                      setNewTaskDate(date ? format(date, 'yyyy-MM-dd') : '');
                      setTaskCalendarOpen(false);
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {newTaskDate && (
              <p className="text-[10px] text-muted-foreground -mt-1">
                Prazo: {format(new Date(newTaskDate), "d 'de' MMMM yyyy", { locale: pt })}
              </p>
            )}

            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem tarefas.</p>
            ) : (
              tasks.map((task: any) => {
                const isOverdue = task.status !== 'done' && task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                return (
                  <div key={task.id} className="flex items-center gap-2 text-xs border rounded-md p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                      onClick={() => updateTask.mutate({
                        id: task.id,
                        status: task.status === 'done' ? 'pending' : 'done',
                        completed_at: task.status === 'done' ? null : new Date().toISOString(),
                      })}
                    >
                      <CheckCircle className={`h-4 w-4 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        task.status === 'done' && 'line-through text-muted-foreground',
                        isOverdue && 'text-destructive font-medium',
                      )}>
                        {task.title}
                      </span>
                      {task.due_date && (
                        <span className={cn(
                          'block',
                          isOverdue ? 'text-destructive' : 'text-muted-foreground',
                        )}>
                          {format(new Date(task.due_date), "d MMM yyyy", { locale: pt })}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
