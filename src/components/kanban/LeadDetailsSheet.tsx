import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Flame, Sun, Snowflake, Circle, Trash2, CalendarIcon, Lock,
  Phone, Mail, MessageCircle, Plus, CheckCircle2, Clock, FileText,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { KanbanLead } from '@/hooks/useKanbanState';
import type { LeadTemperature, SourceCategory } from '@/types';
import { cn } from '@/lib/utils';
import { sourceCategoryLabels } from '@/types';
import { useLeadActivities } from '@/hooks/useLeadActivities';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';

interface LeadDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: KanbanLead | null;
  onSave: (leadId: string, updates: Partial<KanbanLead>) => void;
  onDelete: (leadId: string) => void;
  isRecruitment?: boolean;
  dbLeadId?: string;
  agencyId?: string;
}

const temperatureOptions: { value: LeadTemperature; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'hot', label: 'Quente', icon: <Flame className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'warm', label: 'Morno', icon: <Sun className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'cold', label: 'Frio', icon: <Snowflake className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'undefined', label: 'Indefinido', icon: <Circle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
];

const categoryColors: Record<SourceCategory, string> = {
  posicionamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  referencias: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  espontaneo: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const activityTypeLabels: Record<string, { label: string; icon: string }> = {
  call: { label: 'Chamada', icon: '📞' },
  email: { label: 'Email', icon: '📧' },
  note: { label: 'Nota', icon: '📝' },
  stage_change: { label: 'Mudança de etapa', icon: '➡️' },
  task: { label: 'Tarefa', icon: '✅' },
  document: { label: 'Documento', icon: '📄' },
};

export function LeadDetailsSheet({
  open,
  onOpenChange,
  lead,
  onSave,
  onDelete,
  isRecruitment = false,
  dbLeadId,
  agencyId,
}: LeadDetailsSheetProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<KanbanLead>>({});
  const [activeTab, setActiveTab] = useState('resumo');
  const [newNote, setNewNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();

  const effectiveLeadId = dbLeadId || lead?.id;
  const { activities, addActivity } = useLeadActivities(effectiveLeadId);
  const { tasks, addTask, updateTask, deleteTask } = useLeadTasks(effectiveLeadId);

  useEffect(() => {
    if (lead) setFormData({ ...lead });
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    const { sourceId, source, sourceCategory, ...editableFields } = formData;
    onSave(lead.id, editableFields);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Tem a certeza que deseja eliminar esta lead?')) {
      onDelete(lead.id);
      onOpenChange(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !agencyId) return;
    addActivity.mutate({
      lead_id: effectiveLeadId!,
      agency_id: agencyId,
      activity_type: 'note',
      description: newNote,
    });
    setNewNote('');
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !agencyId) return;
    addTask.mutate({
      lead_id: effectiveLeadId!,
      agency_id: agencyId,
      title: newTaskTitle,
      due_date: newTaskDueDate?.toISOString().split('T')[0],
      assigned_to: user?.id,
    });
    setNewTaskTitle('');
    setNewTaskDueDate(undefined);
  };

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    updateTask.mutate({
      id: taskId,
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {lead.clientName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg">{lead.clientName}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {isRecruitment ? 'Candidato' : 'Lead'}
                  </Badge>
                  {lead.source && <Badge variant="secondary" className="text-xs">{lead.source}</Badge>}
                </SheetDescription>
              </div>
            </div>
            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
                <Phone className="h-3.5 w-3.5" /> Ligar
              </a>
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-info/10 text-info text-sm hover:bg-info/20 transition-colors">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 text-success text-sm hover:bg-success/20 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </SheetHeader>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="atividade" className="text-xs">Atividade</TabsTrigger>
            <TabsTrigger value="tarefas" className="text-xs">Tarefas</TabsTrigger>
            <TabsTrigger value="notas" className="text-xs">Notas</TabsTrigger>
          </TabsList>

          {/* RESUMO TAB */}
          <TabsContent value="resumo" className="p-6 space-y-4 mt-0">
            {/* Source - readonly */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <Label className="flex items-center gap-2 text-muted-foreground text-xs">
                <Lock className="h-3 w-3" /> Origem (não editável)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-medium text-sm">{lead.source || 'Não definida'}</span>
                {lead.sourceCategory && (
                  <Badge variant="outline" className={cn('text-xs', categoryColors[lead.sourceCategory])}>
                    {sourceCategoryLabels[lead.sourceCategory]}
                  </Badge>
                )}
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <Label className="text-xs">Temperatura</Label>
              <div className="flex gap-2 flex-wrap">
                {temperatureOptions.map(option => (
                  <Button key={option.value} type="button" variant="outline" size="sm"
                    className={cn('gap-1.5 text-xs', formData.temperature === option.value && option.color)}
                    onClick={() => setFormData({ ...formData, temperature: option.value })}>
                    {option.icon} {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={formData.clientName || ''} onChange={e => setFormData({ ...formData, clientName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Agente</Label>
                <Input value={formData.agentName || ''} onChange={e => setFormData({ ...formData, agentName: e.target.value })} />
              </div>
            </div>

            {/* Next Activity */}
            <div className="space-y-1">
              <Label className="text-xs">Próximo Agendamento</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('justify-start text-left font-normal flex-1 text-sm', !formData.nextActivityDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.nextActivityDate ? format(new Date(formData.nextActivityDate), 'PPP', { locale: pt }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formData.nextActivityDate ? new Date(formData.nextActivityDate) : undefined}
                      onSelect={date => setFormData({ ...formData, nextActivityDate: date?.toISOString() })}
                      initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Input placeholder="Descrição da atividade" value={formData.nextActivityDescription || ''}
                onChange={e => setFormData({ ...formData, nextActivityDescription: e.target.value })} />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea rows={3} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>Guardar</Button>
            </div>
          </TabsContent>

          {/* ATIVIDADE TAB */}
          <TabsContent value="atividade" className="p-6 mt-0">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem atividade registada.</p>
              ) : (
                activities.map(activity => {
                  const typeInfo = activityTypeLabels[activity.activity_type] || { label: activity.activity_type, icon: '📌' };
                  return (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{typeInfo.label}</p>
                        {activity.description && <p className="text-muted-foreground text-xs">{activity.description}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.user_name} · {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: pt })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAREFAS TAB */}
          <TabsContent value="tarefas" className="p-6 mt-0">
            <div className="space-y-3">
              {/* Add task inline */}
              <div className="flex gap-2">
                <Input placeholder="Nova tarefa..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="text-sm" />
                <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem tarefas.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                    <Checkbox checked={task.status === 'done'} onCheckedChange={() => handleToggleTask(task.id, task.status)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('pt-PT')}
                          </span>
                        )}
                        {task.assignee_name && <span>{task.assignee_name}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTask.mutate(task.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* NOTAS TAB */}
          <TabsContent value="notas" className="p-6 mt-0">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea placeholder="Adicionar nota..." value={newNote} onChange={e => setNewNote(e.target.value)}
                  rows={2} className="text-sm" />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="self-end">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {activities.filter(a => a.activity_type === 'note').map(note => (
                <div key={note.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p>{note.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.user_name} · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: pt })}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
