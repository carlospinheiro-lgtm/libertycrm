import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Flame, Sun, Snowflake, Circle, Trash2 } from 'lucide-react';
import type { KanbanLead } from '@/hooks/useKanbanState';
import type { LeadTemperature } from '@/types';
import { cn } from '@/lib/utils';

interface LeadDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: KanbanLead | null;
  onSave: (leadId: string, updates: Partial<KanbanLead>) => void;
  onDelete: (leadId: string) => void;
}

const temperatureOptions: { value: LeadTemperature; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'hot', label: 'Quente', icon: <Flame className="h-4 w-4" />, color: 'bg-destructive text-destructive-foreground' },
  { value: 'warm', label: 'Morno', icon: <Sun className="h-4 w-4" />, color: 'bg-warning text-warning-foreground' },
  { value: 'cold', label: 'Frio', icon: <Snowflake className="h-4 w-4" />, color: 'bg-info text-info-foreground' },
  { value: 'undefined', label: 'Indefinido', icon: <Circle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
];

export function LeadDetailsSheet({
  open,
  onOpenChange,
  lead,
  onSave,
  onDelete,
}: LeadDetailsSheetProps) {
  const [formData, setFormData] = useState<Partial<KanbanLead>>({});

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    onSave(lead.id, formData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (confirm('Tem a certeza que deseja eliminar esta lead?')) {
      onDelete(lead.id);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes da Lead</SheetTitle>
          <SheetDescription>
            Visualize e edite os dados da lead.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-6">
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

          <div className="grid gap-2">
            <Label htmlFor="agency">Agência</Label>
            <Input
              id="agency"
              value={formData.agency || ''}
              onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="source">Origem</Label>
            <Input
              id="source"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Next Activity Info */}
          {formData.nextActivityDate && (
            <div className="rounded-lg border border-border p-3 bg-muted/50">
              <Label className="text-sm font-medium">Próxima Atividade</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(formData.nextActivityDate).toLocaleString('pt-PT')}
              </p>
              {formData.nextActivityDescription && (
                <p className="text-sm mt-1">{formData.nextActivityDescription}</p>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
