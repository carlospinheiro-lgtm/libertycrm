import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Flame, Sun, Snowflake, Circle, Trash2, CalendarIcon, Download, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { KanbanLead } from '@/hooks/useKanbanState';
import type { LeadTemperature, SourceCategory } from '@/types';
import { cn } from '@/lib/utils';
import { sourceCategoryLabels } from '@/types';

interface LeadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: KanbanLead | null;
  onSave: (leadId: string, updates: Partial<KanbanLead>) => void;
  onDelete: (leadId: string) => void;
  isRecruitment?: boolean;
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

export function LeadDetailsDialog({
  open,
  onOpenChange,
  lead,
  onSave,
  onDelete,
  isRecruitment = false,
}: LeadDetailsDialogProps) {
  const [formData, setFormData] = useState<Partial<KanbanLead>>({});

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    // Don't allow changing source-related fields
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Lead</DialogTitle>
          <DialogDescription>
            Visualize e edite os dados da lead.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Source Display - READONLY */}
          <div className="grid gap-2 p-3 bg-muted/50 rounded-lg border">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-3 w-3" />
              Origem (não editável)
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-medium">{lead.source || 'Não definida'}</span>
              {lead.sourceCategory && (
                <Badge variant="outline" className={categoryColors[lead.sourceCategory]}>
                  {sourceCategoryLabels[lead.sourceCategory]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              A origem é definida na criação da lead e não pode ser alterada.
            </p>
          </div>

          {/* Temperature Selection */}
          <div className="grid gap-2">
            <Label>Temperatura do Cliente</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agentName">Agente</Label>
              <Input
                id="agentName"
                value={formData.agentName || ''}
                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="agency">Agência</Label>
            <Input
              id="agency"
              value={formData.agency || ''}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Next Activity - Editable */}
          <div className="grid gap-2">
            <Label>Próximo Agendamento</Label>
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
                      ? format(new Date(formData.nextActivityDate), 'PPP', { locale: pt })
                      : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.nextActivityDate ? new Date(formData.nextActivityDate) : undefined}
                    onSelect={(date) => setFormData({ ...formData, nextActivityDate: date?.toISOString() })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Input
              placeholder="Descrição da atividade"
              value={formData.nextActivityDescription || ''}
              onChange={(e) => setFormData({ ...formData, nextActivityDescription: e.target.value })}
            />
          </div>

          {/* CV Download for Recruitment */}
          {isRecruitment && (
            <div className="grid gap-2">
              <Label htmlFor="cvUrl">URL do Currículo</Label>
              <Input
                id="cvUrl"
                type="url"
                value={formData.cvUrl || ''}
                onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })}
                placeholder="https://..."
              />
              {formData.cvUrl && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(formData.cvUrl, '_blank')}
                >
                  <Download className="h-4 w-4" />
                  Download Currículo
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
