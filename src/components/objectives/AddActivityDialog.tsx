import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Activity, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  activityTypesVendedores,
  activityTypesCompradores,
  activityTypesRecrutamento,
  activityTypesIntermediacao,
} from '@/types';

// Activity objectives list
const activityObjectivesList = [
  ...activityTypesVendedores.map(t => ({ id: t.value, name: t.label, flow: 'Vendedores' })),
  ...activityTypesCompradores.map(t => ({ id: t.value, name: t.label, flow: 'Compradores' })),
  ...activityTypesRecrutamento.map(t => ({ id: t.value, name: t.label, flow: 'Recrutamento' })),
  ...activityTypesIntermediacao.map(t => ({ id: t.value, name: t.label, flow: 'Crédito' })),
];

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddActivityDialog({ open, onOpenChange }: AddActivityDialogProps) {
  const [objectiveId, setObjectiveId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (!objectiveId || !value) {
      toast.error('Preencha o objetivo e o valor');
      return;
    }

    const objective = activityObjectivesList.find(o => o.id === objectiveId);
    
    // TODO: Connect to database - save the activity
    console.log('New activity:', { objectiveId, value, notes, date });
    
    toast.success(`Atividade registada: +${value} em ${objective?.name}`);
    
    // Reset form
    setObjectiveId('');
    setValue('');
    setNotes('');
    setDate(new Date());
    onOpenChange(false);
  };

  const handleCancel = () => {
    setObjectiveId('');
    setValue('');
    setNotes('');
    setDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" />
            Adicionar Atividade
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Registe atividades realizadas que fazem avançar os seus objetivos.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="activity-objective">Tipo de Atividade</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Selecione o tipo de atividade que realizou: Posicionamento, Leads, Chamadas, Visitas, etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger id="activity-objective" className="border-primary/20 focus:ring-primary/30">
                <SelectValue placeholder="Selecionar atividade" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {activityObjectivesList.map((obj) => (
                  <SelectItem 
                    key={obj.id} 
                    value={obj.id}
                    className="flex items-center"
                  >
                    <span>{obj.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({obj.flow})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-value">Quantidade</Label>
            <Input
              id="activity-value"
              type="number"
              placeholder="Ex: 5, 10, 20"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-primary/20 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-primary/20',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: pt }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-notes">Notas (opcional)</Label>
            <Textarea
              id="activity-notes"
              placeholder="Descrição adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-primary/20 focus:ring-primary/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Registar Atividade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
