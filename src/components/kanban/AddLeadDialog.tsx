import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Flame, Sun, Snowflake, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LeadTemperature } from '@/types';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  onAdd: (lead: KanbanLead) => void;
  isRecruitment?: boolean;
}

const temperatureOptions: { value: LeadTemperature; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'hot', label: 'Quente', icon: <Flame className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'warm', label: 'Morno', icon: <Sun className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'cold', label: 'Frio', icon: <Snowflake className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'undefined', label: 'Indefinido', icon: <Circle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
];

const sourceOptions = [
  'Portal Imobiliário',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'Referência',
  'Website',
  'Presencial',
  'Outro',
];

export function AddLeadDialog({
  open,
  onOpenChange,
  columns,
  onAdd,
  isRecruitment = false,
}: AddLeadDialogProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    email: '',
    agentName: '',
    agency: '',
    source: '',
    notes: '',
    temperature: 'undefined' as LeadTemperature,
    nextActivityDate: undefined as Date | undefined,
    nextActivityDescription: '',
    cvUrl: '',
  });

  const handleSubmit = () => {
    if (!formData.clientName || !formData.phone || !formData.agentName) return;

    const newLead: KanbanLead = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      phone: formData.phone,
      email: formData.email,
      agentName: formData.agentName,
      agency: formData.agency,
      source: formData.source,
      notes: formData.notes,
      temperature: formData.temperature,
      entryDate: new Date().toLocaleDateString('pt-PT'),
      columnId: columns[0]?.id || '',
      nextActivityDate: formData.nextActivityDate?.toISOString(),
      nextActivityDescription: formData.nextActivityDescription,
      cvUrl: isRecruitment ? formData.cvUrl : undefined,
    };

    onAdd(newLead);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      clientName: '',
      phone: '',
      email: '',
      agentName: '',
      agency: '',
      source: '',
      notes: '',
      temperature: 'undefined',
      nextActivityDate: undefined,
      nextActivityDescription: '',
      cvUrl: '',
    });
  };

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
          {/* Temperature Selection */}
          <div className="grid gap-2">
            <Label>Temperatura</Label>
            <div className="flex gap-2 flex-wrap">
              {temperatureOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2',
                    formData.temperature === option.value && option.color
                  )}
                  onClick={() => setFormData({ ...formData, temperature: option.value })}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clientName">{isRecruitment ? 'Nome do Candidato' : 'Nome do Cliente'} *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

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
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Braga">Braga</SelectItem>
                  <SelectItem value="Barcelos">Barcelos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="source">Origem</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar origem" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CV URL for Recruitment */}
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

          {/* Next Activity */}
          <div className="grid gap-2">
            <Label>Próxima Atividade</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal flex-1',
                      !formData.nextActivityDate && 'text-muted-foreground'
                    )}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.clientName || !formData.phone || !formData.agentName}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
