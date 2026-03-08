import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon, Flame, Sun, Snowflake, Circle,
  Copy, Home, ShoppingBag, Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LeadTemperature, Source, SourceCategory } from '@/types';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';
import { defaultSources, sourceCategoryLabels } from '@/types';
import { useContractDurationSettings } from '@/hooks/useAgencySettings';

// ✅ Colunas do pipeline Vendedores para duplicação
const vendedoresColumns: KanbanColumn[] = [
  { id: 'novo-vendedor',        title: 'Novo',              color: 'blue'   },
  { id: 'contacto-feito',       title: 'Contacto Feito',    color: 'cyan'   },
  { id: 'visita-agendada',      title: 'Visita Agendada',   color: 'yellow' },
  { id: 'avaliacao',            title: 'Avaliação',         color: 'yellow' },
  { id: 'angariado-exclusivo',  title: 'Angariado (Excl.)', color: 'green'  },
  { id: 'publicado',            title: 'Publicado',         color: 'green'  },
  { id: 'vendido',              title: 'Vendido',           color: 'green'  },
];

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  onAdd: (lead: KanbanLead, duplicateToSeller?: boolean) => void;
  isRecruitment?: boolean;
  leadFlow?: 'vendedores' | 'compradores';
}

// ✅ Tipo de cliente
type ClientType = 'comprador' | 'vendedor' | 'ambos';

const clientTypeOptions: { value: ClientType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'comprador', label: 'Comprador',  icon: <ShoppingBag className="h-3.5 w-3.5" />, color: 'bg-blue-500 text-white'   },
  { value: 'vendedor',  label: 'Vendedor',   icon: <Home className="h-3.5 w-3.5" />,        color: 'bg-green-500 text-white'  },
  { value: 'ambos',     label: 'Comprador + Vendedor', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-purple-500 text-white' },
];

const temperatureOptions: { value: LeadTemperature; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'hot',       label: 'Quente',    icon: <Flame className="h-4 w-4" />,     color: 'bg-destructive text-destructive-foreground' },
  { value: 'warm',      label: 'Morno',     icon: <Sun className="h-4 w-4" />,       color: 'bg-warning text-warning-foreground'         },
  { value: 'cold',      label: 'Frio',      icon: <Snowflake className="h-4 w-4" />, color: 'bg-info text-info-foreground'               },
  { value: 'undefined', label: 'Indefinido',icon: <Circle className="h-4 w-4" />,    color: 'bg-muted text-muted-foreground'             },
];

export function AddLeadDialog({
  open, onOpenChange, columns, onAdd,
  isRecruitment = false, leadFlow = 'compradores',
}: AddLeadDialogProps) {
  const [formData, setFormData] = useState({
    clientName:              '',
    phone:                   '',
    email:                   '',
    agentName:               '',
    agency:                  '',
    sourceId:                '',
    notes:                   '',
    temperature:             'undefined' as LeadTemperature,
    nextActivityDate:        undefined as Date | undefined,
    nextActivityDescription: '',
    cvUrl:                   '',
    // ✅ NOVOS campos
    columnId:                columns[0]?.id || '',   // Escolher coluna inicial
    clientType:              'comprador' as ClientType, // Tipo de cliente
  });

  // ✅ Se "ambos" ou "vendedor", mostrar opção de duplicar no pipeline vendedores
  const showDuplicateOption = formData.clientType === 'ambos' || formData.clientType === 'vendedor';
  const [duplicateToSeller, setDuplicateToSeller] = useState(false);
  const [sellerColumnId, setSellerColumnId] = useState(vendedoresColumns[0]?.id || '');

  const availableSources = defaultSources.filter(source =>
    source.isActive && (source.flow === leadFlow || source.flow === 'ambos')
  );

  const sourcesByCategory = availableSources.reduce((acc, source) => {
    if (!acc[source.category]) acc[source.category] = [];
    acc[source.category].push(source);
    return acc;
  }, {} as Record<SourceCategory, Source[]>);

  const selectedSource = defaultSources.find(s => s.id === formData.sourceId);

  const handleSubmit = () => {
    if (!formData.clientName || !formData.phone || !formData.agentName) return;
    if (!formData.sourceId) return;

    const source = defaultSources.find(s => s.id === formData.sourceId);

    const newLead: KanbanLead = {
      id:                      crypto.randomUUID(),
      clientName:              formData.clientName,
      phone:                   formData.phone,
      email:                   formData.email,
      agentName:               formData.agentName,
      agency:                  formData.agency,
      source:                  source?.name || '',
      sourceId:                formData.sourceId,
      sourceCategory:          source?.category || 'espontaneo',
      notes:                   formData.notes,
      temperature:             formData.temperature,
      entryDate:               new Date().toLocaleDateString('pt-PT'),
      // ✅ Usa a coluna escolhida pelo agente
      columnId:                formData.columnId || columns[0]?.id || '',
      nextActivityDate:        formData.nextActivityDate?.toISOString(),
      nextActivityDescription: formData.nextActivityDescription,
      cvUrl:                   isRecruitment ? formData.cvUrl : undefined,
      // ✅ Guarda o tipo de cliente
      clientType:              formData.clientType,
    };

    // ✅ Passa flag de duplicação para o pai tratar
    onAdd(newLead, showDuplicateOption && duplicateToSeller ? true : false);
    onOpenChange(false);

    setFormData({
      clientName: '', phone: '', email: '', agentName: '', agency: '',
      sourceId: '', notes: '', temperature: 'undefined',
      nextActivityDate: undefined, nextActivityDescription: '', cvUrl: '',
      columnId: columns[0]?.id || '', clientType: 'comprador',
    });
    setDuplicateToSeller(false);
  };

  const isFormValid = formData.clientName && formData.phone && formData.agentName && formData.sourceId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRecruitment ? 'Novo Candidato' : 'Nova Lead'}</DialogTitle>
          <DialogDescription>
            Preencha os dados para adicionar {isRecruitment ? 'um novo candidato' : 'uma nova lead'}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">

          {/* ✅ MELHORIA: Tipo de cliente */}
          {!isRecruitment && (
            <div className="grid gap-2">
              <Label>Tipo de Cliente</Label>
              <div className="flex gap-2 flex-wrap">
                {clientTypeOptions.map(opt => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn('gap-1.5 text-xs', formData.clientType === opt.value && opt.color)}
                    onClick={() => {
                      setFormData({ ...formData, clientType: opt.value });
                      setDuplicateToSeller(false);
                    }}
                  >
                    {opt.icon}{opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Temperature */}
          <div className="grid gap-2">
            <Label>Temperatura</Label>
            <div className="flex gap-2 flex-wrap">
              {temperatureOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('gap-2', formData.temperature === option.value && option.color)}
                  onClick={() => setFormData({ ...formData, temperature: option.value })}
                >
                  {option.icon}{option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="clientName">
              {isRecruitment ? 'Nome do Candidato' : 'Nome do Cliente'} *
            </Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          {/* Telefone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="912 345 678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.pt"
              />
            </div>
          </div>

          {/* Agente + Agência */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="agentName">{isRecruitment ? 'Recrutador' : 'Agente'} *</Label>
              <Input
                id="agentName"
                value={formData.agentName}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                placeholder="Nome do agente"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency">Agência</Label>
              <Select
                value={formData.agency}
                onValueChange={(value) => setFormData({ ...formData, agency: value })}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Braga">Braga</SelectItem>
                  <SelectItem value="Barcelos">Barcelos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origem */}
          <div className="grid gap-2">
            <Label htmlFor="source" className="flex items-center gap-1">
              Origem <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-1">(obrigatório)</span>
            </Label>
            <Select
              value={formData.sourceId}
              onValueChange={(value) => setFormData({ ...formData, sourceId: value })}
            >
              <SelectTrigger className={cn(!formData.sourceId && 'border-destructive')}>
                <SelectValue placeholder="Selecionar origem" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourcesByCategory).map(([category, sources]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                      {sourceCategoryLabels[category as SourceCategory]}
                    </div>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>{source.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {selectedSource && (
              <p className="text-xs text-muted-foreground">
                Categoria: {sourceCategoryLabels[selectedSource.category]}
              </p>
            )}
          </div>

          {/* ✅ MELHORIA: Escolher coluna inicial no Kanban */}
          {!isRecruitment && (
            <div className="grid gap-2">
              <Label>Etapa inicial no Kanban</Label>
              <Select
                value={formData.columnId}
                onValueChange={(value) => setFormData({ ...formData, columnId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Por defeito entra em "{columns[0]?.title}"
              </p>
            </div>
          )}

          {/* ✅ MELHORIA: Duplicar para pipeline Vendedores */}
          {showDuplicateOption && !isRecruitment && (
            <div className={cn(
              'rounded-lg border p-3 space-y-3',
              duplicateToSeller ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20' : 'border-dashed',
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Duplicar no CRM Vendedores</span>
                  {formData.clientType === 'ambos' && (
                    <Badge variant="secondary" className="text-[10px]">Recomendado</Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant={duplicateToSeller ? 'default' : 'outline'}
                  size="sm"
                  className={cn('text-xs', duplicateToSeller && 'bg-purple-500 hover:bg-purple-600')}
                  onClick={() => setDuplicateToSeller(!duplicateToSeller)}
                >
                  {duplicateToSeller ? 'Ativo ✓' : 'Ativar'}
                </Button>
              </div>
              {duplicateToSeller && (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Etapa no CRM Vendedores</Label>
                  <Select value={sellerColumnId} onValueChange={setSellerColumnId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedoresColumns.map(col => (
                        <SelectItem key={col.id} value={col.id} className="text-xs">
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    O contacto será criado em ambos os pipelines simultaneamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CV URL para recrutamento */}
          {isRecruitment && (
            <div className="grid gap-2">
              <Label htmlFor="cvUrl">URL do Currículo</Label>
              <Input
                id="cvUrl"
                type="url"
                value={formData.cvUrl}
                onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          {/* Próxima Atividade */}
          <div className="grid gap-2">
            <Label>Próxima Atividade</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('justify-start text-left font-normal flex-1', !formData.nextActivityDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.nextActivityDate
                      ? format(formData.nextActivityDate, 'PPP', { locale: pt })
                      : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.nextActivityDate}
                    onSelect={(date) => setFormData({ ...formData, nextActivityDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Input
              placeholder="Descrição da atividade"
              value={formData.nextActivityDescription}
              onChange={(e) => setFormData({ ...formData, nextActivityDescription: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isFormValid} className="gap-2">
            {duplicateToSeller && <Copy className="h-3.5 w-3.5" />}
            {duplicateToSeller ? 'Adicionar nos 2 pipelines' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
