import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Flame, Sun, Snowflake, Circle, Trash2, CalendarIcon,
  Phone, Mail, MessageCircle, Plus, X, Clock, MapPin, CheckCircle, Calculator,
  ArrowRightLeft, Copy,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, isBefore, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSellerInteractions, type SellerInteraction } from '@/hooks/useSellerInteractions';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useContractDurationSettings } from '@/hooks/useAgencySettings';
import { CommissionCalculator } from '@/components/commission/CommissionCalculator';
import { toast } from 'sonner';
import type { SellerCardLead } from './SellerKanbanCard';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: SellerCardLead | null;
  agencyId?: string;
  onSave: (leadId: string, updates: Record<string, any>) => void;
  onDelete: (leadId: string) => void;
}

const propertyTypes = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'outro', label: 'Outro' },
];

const motivations = ['Mudança', 'Partilha', 'Divórcio', 'Investimento', 'Outro'];
const deadlines = ['0-30', '30-90', '90+'];
const exclusivities = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'indefinido', label: 'Indefinido' },
];

const temperatureOptions = [
  { value: 'hot', label: 'Quente', icon: <Flame className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'warm', label: 'Morno', icon: <Sun className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'cold', label: 'Frio', icon: <Snowflake className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'undefined', label: 'Indefinido', icon: <Circle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
];

const interactionTypeConfig: Record<string, { label: string; icon: string }> = {
  call: { label: 'Chamada', icon: '📞' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  email: { label: 'Email', icon: '📧' },
  meeting: { label: 'Reunião', icon: '🤝' },
  stage_change: { label: 'Mudança de etapa', icon: '➡️' },
  note: { label: 'Nota', icon: '📝' },
  other: { label: 'Outro', icon: '📌' },
};

const buyerPipelineColumns = [
  { id: 'novo', title: 'Novo' },
  { id: 'contacto-feito', title: 'Contacto Feito' },
  { id: 'qualificacao', title: 'Qualificação' },
  { id: 'ativo', title: 'Ativo (Imóveis enviados)' },
  { id: 'visitas', title: 'Visitas' },
  { id: 'proposta-negociacao', title: 'Proposta / Negociação' },
  { id: 'reserva-cpcv', title: 'Reserva / CPCV' },
  { id: 'perdido-followup', title: 'Perdido / Follow-up' },
];

const sellerPipelineColumns = [
  { id: 'novo', title: 'Novo' },
  { id: 'contacto-feito', title: 'Contacto Feito' },
  { id: 'avaliacao', title: 'Avaliação / Estudo de Mercado' },
  { id: 'apresentacao', title: 'Apresentação de Serviços' },
  { id: 'negociacao', title: 'Negociação' },
  { id: 'angariacao', title: 'Angariação' },
  { id: 'angariacao-reservada', title: 'Angariação Reservada' },
  { id: 'perdido-followup', title: 'Perdido / Follow-up' },
];


const typologyOptions = ['T0', 'T1', 'T2', 'T3', 'T4+', 'Moradia', 'Terreno', 'Comercial'];


export function SellerDetailsSheet({ open, onOpenChange, lead, agencyId, onSave, onDelete }: Props) {
  const { user } = useAuth();
  const { interactions, addInteraction } = useSellerInteractions(lead?.id);
  const { tasks, addTask, updateTask, deleteTask } = useLeadTasks(lead?.id);
  const { data: contractSettings } = useContractDurationSettings(agencyId);
  const contractOptions = contractSettings?.options ?? [90, 120, 150, 180];
  const contractDefault = String(contractSettings?.defaultDays ?? 120);

  const [activeTab, setActiveTab] = useState('dados');
  const [interactionNote, setInteractionNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [visitTime, setVisitTime] = useState('');
  const [visitAddress, setVisitAddress] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const [form, setForm] = useState<Record<string, any>>({
    property_type: '',
    location: '',
    estimated_value: '',
    next_action_text: '',
    next_action_at: '',
    seller_motivation: '',
    seller_deadline: '',
    seller_exclusivity: '',
    temperature: 'warm',
    commission_percentage: '',
    contract_duration: '',
    property_typology: [] as string[],
  });

  useEffect(() => {
    if (lead) {
      setForm({
        property_type: lead.propertyType || '',
        location: lead.location || '',
        estimated_value: lead.estimatedValue?.toString() || '',
        next_action_text: lead.nextActionText || '',
        next_action_at: lead.nextActionAt ? new Date(lead.nextActionAt).toISOString().slice(0, 10) : '',
        seller_motivation: lead.sellerMotivation || '',
        seller_deadline: lead.sellerDeadline || '',
        seller_exclusivity: lead.sellerExclusivity || '',
        temperature: lead.temperature || 'warm',
        commission_percentage: lead.commissionPercentage?.toString() || '',
        contract_duration: lead.contractDuration || contractDefault,
        property_typology: Array.isArray((lead as any).propertyTypology) ? (lead as any).propertyTypology : (lead as any).propertyTypology ? [(lead as any).propertyTypology] : [],
      });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    onSave(lead.id, {
      property_type: form.property_type || null,
      location: form.location || null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      next_action_text: form.next_action_text || null,
      next_action_at: form.next_action_at || null,
      seller_motivation: form.seller_motivation || null,
      seller_deadline: form.seller_deadline || null,
      seller_exclusivity: form.seller_exclusivity || null,
      temperature: form.temperature,
      commission_percentage: form.commission_percentage ? Number(form.commission_percentage) : null,
      contract_duration: form.contract_duration || null,
      typology: form.property_typology,
    });
    toast.success('Lead atualizada');
  };

  const handleDelete = () => {
    if (confirm('Tem a certeza que deseja eliminar esta lead?')) {
      onDelete(lead.id);
      onOpenChange(false);
    }
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
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !agencyId) return;
    addInteraction.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      type: 'note',
      note: noteText.trim(),
    });
    setNoteText('');
    setShowNoteForm(false);
    toast.success('Nota adicionada com sucesso');
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !agencyId) return;
    addTask.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      title: newTaskTitle,
      assigned_to: user?.id,
    });
    setNewTaskTitle('');
  };

  const handleAddVisit = () => {
    if (!visitAddress.trim() || !visitDate || !agencyId) return;
    const dateStr = format(visitDate, 'yyyy-MM-dd');
    const title = `Visita: ${visitAddress.trim()}`;
    const description = [visitTime && `Hora: ${visitTime}`, visitNotes.trim()].filter(Boolean).join(' — ');
    addTask.mutate({
      lead_id: lead.id,
      agency_id: agencyId,
      title,
      description: description || undefined,
      due_date: dateStr,
      assigned_to: user?.id,
    });
    setVisitDate(undefined);
    setVisitTime('');
    setVisitAddress('');
    setVisitNotes('');
    setShowVisitForm(false);
    toast.success('Visita agendada com sucesso');
  };

  const addTypology = (value: string) => {
    const current = form.property_typology || [];
    if (!current.includes(value)) {
      setForm({ ...form, property_typology: [...current, value] });
    }
  };

  const removeTypology = (idx: number) => {
    setForm({ ...form, property_typology: (form.property_typology || []).filter((_: string, i: number) => i !== idx) });
  };

  const notes = interactions.filter((i: SellerInteraction) => (i.type as string) === 'note');
  const contactInteractions = interactions.filter((i: SellerInteraction) => (i.type as string) !== 'note');
  const visits = tasks.filter((t: any) => t.title?.startsWith('Visita:'));
  const regularTasks = tasks.filter((t: any) => !t.title?.startsWith('Visita:'));

  const nextActionDate = form.next_action_at ? new Date(form.next_action_at) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {lead.clientName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{lead.clientName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">Vendedor</Badge>
                {lead.source && <Badge variant="secondary" className="text-xs">{lead.source}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
                <Phone className="h-3.5 w-3.5" /> Ligar
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-info/10 text-info text-sm hover:bg-info/20 transition-colors">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            )}
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 text-success text-sm hover:bg-success/20 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="tarefas" className="text-xs">Tarefas</TabsTrigger>
          </TabsList>

          {/* DADOS TAB */}
          <TabsContent value="dados" className="p-6 space-y-4 mt-0">
            {/* Temperature */}
            <div className="space-y-2">
              <Label className="text-xs">Temperatura</Label>
              <div className="flex gap-2 flex-wrap">
                {temperatureOptions.map(opt => (
                  <Button key={opt.value} variant="outline" size="sm"
                    className={cn('gap-1.5 text-xs', form.temperature === opt.value && opt.color)}
                    onClick={() => setForm({ ...form, temperature: opt.value })}>
                    {opt.icon} {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Property type & location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Imóvel</Label>
                <Select value={form.property_type} onValueChange={v => setForm({ ...form, property_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Localização</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Braga Centro" />
              </div>
            </div>

            {/* Typology multi-select */}
            <div className="space-y-2">
              <Label className="text-xs">Tipologia</Label>
              <div className="flex flex-wrap gap-1.5">
                {(form.property_typology || []).map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button onClick={() => removeTypology(i)} className="ml-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <Select value="" onValueChange={addTypology}>
                <SelectTrigger><SelectValue placeholder="Adicionar tipologia..." /></SelectTrigger>
                <SelectContent>
                  {typologyOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Valor Estimado (€)</Label>
              <div className="flex gap-2">
                <Input type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} placeholder="0" className="flex-1" />
                {agencyId && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0" title="Calcular comissão">
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <CommissionCalculator
                        propertyValue={Number(form.estimated_value) || 0}
                        isExclusivity={form.seller_exclusivity === 'sim'}
                        agencyId={agencyId}
                        onSelectCommission={(pct) => {
                          setForm(prev => ({ ...prev, commission_percentage: String(pct) }));
                          toast.success(`Comissão de ${pct}% aplicada`);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Next action with calendar */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Label className="text-xs font-medium">Próxima ação</Label>
              <Input placeholder="Descrição da próxima ação" value={form.next_action_text || ''}
                onChange={e => setForm({ ...form, next_action_text: e.target.value })} className="text-sm" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm', !form.next_action_at && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextActionDate ? format(nextActionDate, 'PPP', { locale: pt }) : 'Data da ação'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={nextActionDate}
                    onSelect={d => setForm({ ...form, next_action_at: d ? format(d, 'yyyy-MM-dd') : '' })}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Commercial info */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Informação Comercial</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Motivação</Label>
                  <Select value={form.seller_motivation} onValueChange={v => setForm({ ...form, seller_motivation: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {motivations.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prazo Venda</Label>
                  <Select value={form.seller_deadline} onValueChange={v => setForm({ ...form, seller_deadline: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {deadlines.map(d => <SelectItem key={d} value={d}>{d} dias</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Exclusividade</Label>
                  <Select value={form.seller_exclusivity} onValueChange={v => setForm({ ...form, seller_exclusivity: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {exclusivities.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Comissão (%)</Label>
                  <Input type="number" step="0.1" value={form.commission_percentage} onChange={e => setForm({ ...form, commission_percentage: e.target.value })} placeholder="5" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Duração Contrato</Label>
                <Select value={form.contract_duration} onValueChange={v => setForm({ ...form, contract_duration: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar duração" /></SelectTrigger>
                  <SelectContent>
                    {contractOptions.map(opt => (
                      <SelectItem key={opt} value={String(opt)}>{opt} dias</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* HISTÓRICO TAB */}
          <TabsContent value="historico" className="p-6 space-y-4 mt-0">
            {/* Contact interaction buttons */}
            <div className="space-y-2">
              <Label className="text-xs">Nota (opcional)</Label>
              <Textarea value={interactionNote} onChange={e => setInteractionNote(e.target.value)} placeholder="Descrição do contacto..." rows={2} />
            </div>
            <div className="flex flex-wrap gap-2">
              {['call', 'whatsapp', 'email', 'meeting'].map(type => {
                const config = interactionTypeConfig[type];
                return (
                  <Button key={type} variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleAddInteraction(type)}>
                    {config.icon} {config.label}
                  </Button>
                );
              })}
            </div>

            {/* Add note button */}
            <div>
              {!showNoteForm ? (
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setShowNoteForm(true)}>
                  <Plus className="h-3 w-3" /> Nota
                </Button>
              ) : (
                <div className="space-y-2 p-3 border border-border rounded-lg">
                  <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Escrever nota..." rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNoteForm(false); setNoteText(''); }}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes section */}
            {notes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Notas</h4>
                {notes.map((i: SellerInteraction) => (
                  <div key={i.id} className="text-xs border-l-2 border-warning pl-3 py-1">
                    <p>{i.note}</p>
                    <span className="text-muted-foreground">
                      {i.creator_name} · {formatDistanceToNow(new Date(i.created_at), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Contact interactions */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-medium text-muted-foreground">Interações</h4>
              {contactInteractions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sem interações registadas</p>
              ) : (
                contactInteractions.map((i: SellerInteraction) => {
                  const config = interactionTypeConfig[i.type] || interactionTypeConfig.other;
                  return (
                    <div key={i.id} className="flex gap-3 text-xs border-l-2 border-border pl-3 py-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
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
          <TabsContent value="tarefas" className="p-6 space-y-4 mt-0">
            {/* Quick add task */}
            <div className="flex gap-2">
              <Input placeholder="Nova tarefa..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="text-sm" />
              <Button size="sm" variant="outline" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Regular tasks */}
            {regularTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem tarefas.</p>
            ) : (
              regularTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 text-xs border rounded-md p-2">
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                    onClick={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'pending' : 'done' })}>
                    <CheckCircle className={cn('h-4 w-4', task.status === 'done' ? 'text-green-500' : 'text-muted-foreground')} />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                    {task.due_date && (
                      <span className="block text-muted-foreground">{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTask.mutate(task.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}

            <Separator />

            {/* Visits section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Visitas</h4>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowVisitForm(true)}>
                  <Plus className="h-3 w-3" /> Agendar visita
                </Button>
              </div>

              {showVisitForm && (
                <div className="space-y-2 p-3 border border-border rounded-lg">
                  <Input placeholder="Morada da visita" value={visitAddress} onChange={e => setVisitAddress(e.target.value)} className="text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn('justify-start text-left font-normal text-xs', !visitDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {visitDate ? format(visitDate, 'PPP', { locale: pt }) : 'Data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={visitDate} onSelect={setVisitDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                  <Textarea placeholder="Notas..." value={visitNotes} onChange={e => setVisitNotes(e.target.value)} rows={1} className="text-xs" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddVisit} disabled={!visitAddress.trim() || !visitDate}>Agendar</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowVisitForm(false); setVisitAddress(''); setVisitDate(undefined); setVisitTime(''); setVisitNotes(''); }}>Cancelar</Button>
                  </div>
                </div>
              )}

              {visits.length === 0 && !showVisitForm ? (
                <p className="text-xs text-muted-foreground text-center py-2">Sem visitas agendadas.</p>
              ) : (
                visits.map((task: any) => {
                  const isPast = task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()));
                  return (
                    <div key={task.id} className={cn('flex items-center gap-2 text-xs border rounded-md p-2', isPast && 'opacity-50')}>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                        onClick={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'pending' : 'done' })}>
                        <CheckCircle className={cn('h-4 w-4', task.status === 'done' ? 'text-green-500' : 'text-muted-foreground')} />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
                        {task.due_date && <span className="block text-muted-foreground">{new Date(task.due_date).toLocaleDateString('pt-PT')}</span>}
                        {task.description && <span className="block text-muted-foreground">{task.description}</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask.mutate(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
