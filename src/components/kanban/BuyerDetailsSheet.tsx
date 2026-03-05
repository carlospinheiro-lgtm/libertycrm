import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Flame, Sun, Snowflake, Circle, Trash2, CalendarIcon,
  Phone, Mail, MessageCircle, Plus, Clock, X, MapPin, ArrowRightLeft, Copy,
} from 'lucide-react';
import { format, formatDistanceToNow, isBefore, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useBuyerInteractions } from '@/hooks/useBuyerInteractions';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { LeadTemperature } from '@/types';

interface BuyerLead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  columnId: string;
  temperature: string;
  source?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  zones?: string[];
  typology?: string | null;
  nextActionText?: string | null;
  nextActionAt?: string | null;
  buyerMotive?: string | null;
  buyerTimeline?: string | null;
  buyerFinancing?: string | null;
}

interface BuyerDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: BuyerLead | null;
  agencyId?: string;
  onSave: (leadId: string, updates: Record<string, any>) => void;
  onDelete: (leadId: string) => void;
  onDuplicate?: (leadId: string, targetColumnId: string) => void;
}

const temperatureOptions: { value: LeadTemperature; label: string; icon: React.ReactNode; color: string }[] = [
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

export function BuyerDetailsSheet({ open, onOpenChange, lead, agencyId, onSave, onDelete, onDuplicate }: BuyerDetailsSheetProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('dados');
  const [newZone, setNewZone] = useState('');
  const [interactionNote, setInteractionNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Visit scheduling state
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [visitTime, setVisitTime] = useState('');
  const [visitAddress, setVisitAddress] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  // Move lead state
  const [movePipeline, setMovePipeline] = useState('compradores');
  const [moveColumnId, setMoveColumnId] = useState('');

  const { interactions, addInteraction } = useBuyerInteractions(lead?.id);
  const { tasks, addTask, updateTask, deleteTask } = useLeadTasks(lead?.id);

  useEffect(() => {
    if (lead) {
      setForm({
        clientName: lead.clientName,
        phone: lead.phone,
        email: lead.email,
        temperature: lead.temperature,
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax,
        zones: lead.zones || [],
        typology: lead.typology ? (Array.isArray(lead.typology) ? lead.typology : [lead.typology]) : [],
        nextActionText: lead.nextActionText || '',
        nextActionAt: lead.nextActionAt || '',
        buyerMotive: lead.buyerMotive || '',
        buyerTimeline: lead.buyerTimeline || '',
        buyerFinancing: lead.buyerFinancing || '',
      });
      setMovePipeline('compradores');
      setMoveColumnId('');
    }
  }, [lead]);

  if (!lead) return null;

  const requiresNextAction = lead.columnId !== 'novo';

  const handleSave = () => {
    onSave(lead.id, {
      client_name: form.clientName,
      phone: form.phone,
      email: form.email,
      temperature: form.temperature,
      budget_min: form.budgetMin ? Number(form.budgetMin) : null,
      budget_max: form.budgetMax ? Number(form.budgetMax) : null,
      zones: form.zones,
      typology: form.typology,
      next_action_text: form.nextActionText || null,
      next_action_at: form.nextActionAt || null,
      buyer_motive: form.buyerMotive || null,
      buyer_timeline: form.buyerTimeline || null,
      buyer_financing: form.buyerFinancing || null,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Tem a certeza que deseja eliminar esta lead?')) {
      onDelete(lead.id);
      onOpenChange(false);
    }
  };

  const addZone = () => {
    if (newZone.trim()) {
      setForm({ ...form, zones: [...(form.zones || []), newZone.trim()] });
      setNewZone('');
    }
  };

  const removeZone = (idx: number) => {
    setForm({ ...form, zones: form.zones.filter((_: string, i: number) => i !== idx) });
  };

  const addTypology = (value: string) => {
    const current = form.typology || [];
    if (!current.includes(value)) {
      setForm({ ...form, typology: [...current, value] });
    }
  };

  const removeTypology = (idx: number) => {
    setForm({ ...form, typology: (form.typology || []).filter((_: string, i: number) => i !== idx) });
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

  const handleMoveLead = () => {
    if (!moveColumnId) return;
    if (movePipeline === 'compradores') {
      onSave(lead.id, { column_id: moveColumnId });
      toast.success('Lead movida com sucesso');
    } else {
      // Moving to seller pipeline = change lead_type + column_id
      onSave(lead.id, { column_id: moveColumnId, lead_type: 'seller' });
      toast.success('Lead movida para CRM Vendedores');
    }
    onOpenChange(false);
  };

  const handleDuplicateToSellers = () => {
    if (!moveColumnId || !onDuplicate) return;
    onDuplicate(lead.id, moveColumnId);
    toast.success('Lead duplicada para CRM Vendedores');
  };

  // Separate notes and contact interactions
  const notes = interactions.filter((i: any) => i.type === 'note');
  const contactInteractions = interactions.filter((i: any) => i.type !== 'note');

  // Separate visits from regular tasks
  const visits = tasks.filter((t: any) => t.title?.startsWith('Visita:'));
  const regularTasks = tasks.filter((t: any) => !t.title?.startsWith('Visita:'));

  const currentPipelineColumns = movePipeline === 'compradores' ? buyerPipelineColumns : sellerPipelineColumns;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {lead.clientName.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{lead.clientName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">Comprador</Badge>
                  {lead.source && <Badge variant="secondary" className="text-xs">{lead.source}</Badge>}
                </div>
              </div>
            </div>
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

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={form.clientName || ''} onChange={e => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Orçamento mínimo (€)</Label>
                <Input type="number" value={form.budgetMin ?? ''} onChange={e => setForm({ ...form, budgetMin: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Orçamento máximo (€)</Label>
                <Input type="number" value={form.budgetMax ?? ''} onChange={e => setForm({ ...form, budgetMax: e.target.value })} />
              </div>
            </div>

            {/* Zones */}
            <div className="space-y-2">
              <Label className="text-xs">Zonas de interesse</Label>
              <div className="flex flex-wrap gap-1.5">
                {(form.zones || []).map((z: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {z}
                    <button onClick={() => removeZone(i)} className="ml-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Adicionar zona..." value={newZone} onChange={e => setNewZone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addZone()} className="text-sm" />
                <Button size="sm" variant="outline" onClick={addZone} disabled={!newZone.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Typology - multi-select tags */}
            <div className="space-y-2">
              <Label className="text-xs">Tipologia</Label>
              <div className="flex flex-wrap gap-1.5">
                {(form.typology || []).map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button onClick={() => removeTypology(i)} className="ml-0.5"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <Select value="" onValueChange={addTypology}>
                <SelectTrigger><SelectValue placeholder="Adicionar tipologia..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="T0">T0</SelectItem>
                  <SelectItem value="T1">T1</SelectItem>
                  <SelectItem value="T2">T2</SelectItem>
                  <SelectItem value="T3">T3</SelectItem>
                  <SelectItem value="T4+">T4+</SelectItem>
                  <SelectItem value="Moradia">Moradia</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Next Action */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Label className="text-xs font-medium">
                Próxima ação {requiresNextAction && <span className="text-destructive">*</span>}
              </Label>
              <Input placeholder="Descrição da próxima ação" value={form.nextActionText || ''}
                onChange={e => setForm({ ...form, nextActionText: e.target.value })} className="text-sm" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal text-sm', !form.nextActionAt && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.nextActionAt ? format(new Date(form.nextActionAt), 'PPP', { locale: pt }) : 'Data da ação'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.nextActionAt ? new Date(form.nextActionAt) : undefined}
                    onSelect={date => setForm({ ...form, nextActionAt: date?.toISOString() })}
                    initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Qualification */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground">Qualificação</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Motivo</Label>
                  <Select value={form.buyerMotive || ''} onValueChange={v => setForm({ ...form, buyerMotive: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hpp">HPP</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="arrendamento">Arrendamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Prazo</Label>
                  <Select value={form.buyerTimeline || ''} onValueChange={v => setForm({ ...form, buyerTimeline: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-30">0-30 dias</SelectItem>
                      <SelectItem value="30-90">30-90 dias</SelectItem>
                      <SelectItem value="90+">90+ dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Financiamento</Label>
                  <Select value={form.buyerFinancing || ''} onValueChange={v => setForm({ ...form, buyerFinancing: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="em_analise">Em análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Move Lead Section */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Mover lead</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Pipeline</Label>
                  <Select value={movePipeline} onValueChange={v => { setMovePipeline(v); setMoveColumnId(''); }}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compradores">CRM Compradores</SelectItem>
                      <SelectItem value="vendedores">CRM Vendedores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Etapa</Label>
                  <Select value={moveColumnId} onValueChange={setMoveColumnId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {currentPipelineColumns.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleMoveLead} disabled={!moveColumnId}>
                  <ArrowRightLeft className="h-3 w-3" /> Mover
                </Button>
                {movePipeline === 'vendedores' && onDuplicate && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDuplicateToSellers} disabled={!moveColumnId}>
                    <Copy className="h-3 w-3" /> Duplicar para Vendedores
                  </Button>
                )}
              </div>
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

          {/* HISTÓRICO TAB */}
          <TabsContent value="historico" className="p-6 mt-0 space-y-4">
            {/* Notes section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">📝 Notas</p>
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => setShowNoteForm(!showNoteForm)}>
                  <Plus className="h-3 w-3" /> Adicionar nota
                </Button>
              </div>
              {showNoteForm && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                  <Textarea placeholder="Escrever nota..." value={noteText} onChange={e => setNoteText(e.target.value)} className="text-sm min-h-[60px]" />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setShowNoteForm(false); setNoteText(''); }}>Cancelar</Button>
                    <Button size="sm" className="text-xs h-7" onClick={handleAddNote} disabled={!noteText.trim()}>Guardar</Button>
                  </div>
                </div>
              )}
              {notes.length > 0 && (
                <div className="space-y-2">
                  {notes.map((n: any) => (
                    <div key={n.id} className="p-2.5 bg-muted/30 rounded-lg border border-border">
                      <p className="text-sm">{n.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {n.creator_name} · {format(new Date(n.created_at), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick interaction buttons */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Registar contacto</p>
              <Input placeholder="Nota (opcional)..." value={interactionNote} onChange={e => setInteractionNote(e.target.value)} className="text-sm" />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleAddInteraction('call')} className="gap-1 text-xs">📞 Chamada</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddInteraction('whatsapp')} className="gap-1 text-xs">💬 WhatsApp</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddInteraction('email')} className="gap-1 text-xs">📧 Email</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddInteraction('meeting')} className="gap-1 text-xs">🤝 Reunião</Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Histórico de contactos</p>
              {contactInteractions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem interações registadas.</p>
              ) : (
                contactInteractions.map((i: any) => {
                  const cfg = interactionTypeConfig[i.type] || interactionTypeConfig.other;
                  return (
                    <div key={i.id} className="flex gap-3 text-sm">
                      <span className="text-lg">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{cfg.label}</p>
                        {i.note && <p className="text-muted-foreground text-xs">{i.note}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {i.creator_name} · {format(new Date(i.created_at), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TAREFAS TAB */}
          <TabsContent value="tarefas" className="p-6 mt-0 space-y-4">
            {/* Visits Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Visitas</p>
                </div>
                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => setShowVisitForm(!showVisitForm)}>
                  <Plus className="h-3 w-3" /> Agendar visita
                </Button>
              </div>
              {showVisitForm && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn('w-full justify-start text-left font-normal text-xs', !visitDate && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-1.5 h-3 w-3" />
                            {visitDate ? format(visitDate, 'dd/MM/yyyy') : 'Selecionar...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={visitDate} onSelect={setVisitDate} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Hora</Label>
                      <Input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Morada / Imóvel</Label>
                    <Input placeholder="Morada da visita..." value={visitAddress} onChange={e => setVisitAddress(e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Notas</Label>
                    <Input placeholder="Notas adicionais..." value={visitNotes} onChange={e => setVisitNotes(e.target.value)} className="text-xs h-8" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowVisitForm(false)}>Cancelar</Button>
                    <Button size="sm" className="text-xs h-7" onClick={handleAddVisit} disabled={!visitAddress.trim() || !visitDate}>Agendar</Button>
                  </div>
                </div>
              )}
              {visits.length === 0 && !showVisitForm ? (
                <p className="text-xs text-muted-foreground text-center py-2">Sem visitas agendadas.</p>
              ) : (
                visits.map((visit: any) => {
                  const isPast = visit.due_date && isBefore(new Date(visit.due_date), startOfDay(new Date()));
                  const visitLabel = visit.title.replace('Visita: ', '');
                  return (
                    <div key={visit.id} className={cn(
                      'flex items-start gap-2 py-2 px-2.5 rounded-lg border',
                      isPast ? 'bg-muted/30 border-border text-muted-foreground' : 'bg-primary/5 border-primary/20'
                    )}>
                      <MapPin className={cn('h-3.5 w-3.5 mt-0.5', isPast ? 'text-muted-foreground' : 'text-primary')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', isPast && 'line-through')}>{visitLabel}</p>
                        {visit.due_date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{new Date(visit.due_date).toLocaleDateString('pt-PT')}
                            {visit.description && ` · ${visit.description}`}
                          </span>
                        )}
                      </div>
                      <Checkbox checked={visit.status === 'done'}
                        onCheckedChange={() => updateTask.mutate({ id: visit.id, status: visit.status === 'done' ? 'pending' : 'done', completed_at: visit.status === 'done' ? null : new Date().toISOString() })} className="mt-0.5" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Regular Tasks */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tarefas</p>
              <div className="flex gap-2">
                <Input placeholder="Nova tarefa..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="text-sm" />
                <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {regularTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem tarefas.</p>
              ) : (
                regularTasks.map((task: any) => (
                  <div key={task.id} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                    <Checkbox checked={task.status === 'done'}
                      onCheckedChange={() => updateTask.mutate({ id: task.id, status: task.status === 'done' ? 'pending' : 'done', completed_at: task.status === 'done' ? null : new Date().toISOString() })} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', task.status === 'done' && 'line-through text-muted-foreground')}>{task.title}</p>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTask.mutate(task.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
