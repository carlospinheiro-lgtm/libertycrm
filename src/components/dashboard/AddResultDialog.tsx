import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Mock objectives - TODO: Connect to database
const objectivesList = [
  { id: '1', name: 'Faturação Trimestral Q4', unit: '€' },
  { id: '2', name: 'Novas Angariações', unit: '' },
  { id: '3', name: 'Leads Qualificadas', unit: '' },
  { id: '4', name: 'Pontos de Equipa', unit: 'pts' },
];

interface AddResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResultDialog({ open, onOpenChange }: AddResultDialogProps) {
  const [objectiveId, setObjectiveId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = () => {
    if (!objectiveId || !value) {
      toast.error('Preencha o objetivo e o valor');
      return;
    }

    const objective = objectivesList.find(o => o.id === objectiveId);
    
    // TODO: Connect to database - save the result
    console.log('New result:', { objectiveId, value, notes, date });
    
    toast.success(`Resultado adicionado: +${value}${objective?.unit ? ` ${objective.unit}` : ''} em ${objective?.name}`);
    
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
          <DialogTitle>Adicionar Resultado</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="objective">Objetivo</Label>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger id="objective">
                <SelectValue placeholder="Selecionar objetivo" />
              </SelectTrigger>
              <SelectContent>
                {objectivesList.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id}>
                    {obj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              placeholder="Ex: 1, 500, 8500"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
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
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Descrição adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
