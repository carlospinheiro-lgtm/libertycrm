import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddObjectiveDialog({ open, onOpenChange }: AddObjectiveDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [assignment, setAssignment] = useState<string>('');

  const handleSubmit = () => {
    if (!name || !type || !targetValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // TODO: Connect to database
    const newObjective = {
      name,
      type,
      targetValue: parseFloat(targetValue),
      unit,
      startDate,
      endDate,
      assignment,
    };

    console.log('New objective:', newObjective);
    toast.success('Objetivo criado com sucesso');
    
    // Reset form
    setName('');
    setType('');
    setTargetValue('');
    setUnit('');
    setStartDate(undefined);
    setEndDate(undefined);
    setAssignment('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName('');
    setType('');
    setTargetValue('');
    setUnit('');
    setStartDate(undefined);
    setEndDate(undefined);
    setAssignment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Objetivo</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Objetivo *</Label>
            <Input
              id="name"
              placeholder="Ex: Faturação Trimestral Q1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currency">Monetário</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="percentage">Percentagem</SelectItem>
                  <SelectItem value="points">Pontos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetValue">Valor Alvo *</Label>
              <Input
                id="targetValue"
                type="number"
                placeholder="0"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                placeholder="€, pts, %"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Atribuição</Label>
              <Select value={assignment} onValueChange={setAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agência</SelectItem>
                  <SelectItem value="director">Diretor</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Criar Objetivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
