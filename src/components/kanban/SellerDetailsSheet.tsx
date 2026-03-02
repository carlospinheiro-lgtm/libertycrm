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
import { useSellerInteractions, type SellerInteraction } from '@/hooks/useSellerInteractions';
import { useLeadTasks } from '@/hooks/useLeadTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Mail, MessageCircle, Users, FileText, Trash2, CheckCircle } from 'lucide-react';
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

export function SellerDetailsSheet({ open, onOpenChange, lead, agencyId, onSave, onDelete }: Props) {
  const { user } = useAuth();
  const { interactions, addInteraction } = useSellerInteractions(lead?.id);
  const { tasks, addTask, updateTask } = useLeadTasks(lead?.id);

  const [form, setForm] = useState({
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
  });

  const [interactionNote, setInteractionNote] = useState('');

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
        contract_duration: lead.contractDuration || '',
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
    });
    toast.success('Lead atualizada');
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
              <h4 className="font-medium text-sm">Informação Obrigatória</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Imóvel</Label>
                  <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
                <Label className="text-xs">Localização</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: Braga Centro" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Valor Estimado (€)</Label>
                <Input type="number" value={form.estimated_value} onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} placeholder="0" />
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
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Informação Comercial</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Motivação</Label>
                  <Select value={form.seller_motivation} onValueChange={v => setForm(f => ({ ...f, seller_motivation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {motivations.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prazo Venda</Label>
                  <Select value={form.seller_deadline} onValueChange={v => setForm(f => ({ ...f, seller_deadline: v }))}>
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
                  <Select value={form.seller_exclusivity} onValueChange={v => setForm(f => ({ ...f, seller_exclusivity: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {exclusivities.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Comissão (%)</Label>
                  <Input type="number" step="0.1" value={form.commission_percentage} onChange={e => setForm(f => ({ ...f, commission_percentage: e.target.value }))} placeholder="5" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Duração Contrato</Label>
                <Input value={form.contract_duration} onChange={e => setForm(f => ({ ...f, contract_duration: e.target.value }))} placeholder="Ex: 6 meses" />
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
                interactions.map((i: SellerInteraction) => (
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
