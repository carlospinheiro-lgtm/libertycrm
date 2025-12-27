import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Trophy, HelpCircle, Activity } from 'lucide-react';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  resultTypesVendedores,
  resultTypesCompradores,
  resultTypesRecrutamento,
  resultTypesIntermediacao,
  resultTypesGerais,
  activityTypesVendedores,
  activityTypesCompradores,
  activityTypesRecrutamento,
  activityTypesIntermediacao,
} from '@/types';

// All objectives list - Activity AND Result types
const allObjectivesList = [
  // Activity objectives
  ...activityTypesVendedores.map(t => ({ id: t.value, name: t.label, flow: 'Vendedores', category: 'activity' as const, isCurrency: false })),
  ...activityTypesCompradores.map(t => ({ id: t.value, name: t.label, flow: 'Compradores', category: 'activity' as const, isCurrency: false })),
  ...activityTypesRecrutamento.map(t => ({ id: t.value, name: t.label, flow: 'Recrutamento', category: 'activity' as const, isCurrency: false })),
  ...activityTypesIntermediacao.map(t => ({ id: t.value, name: t.label, flow: 'Crédito', category: 'activity' as const, isCurrency: false })),
  // Result objectives
  ...resultTypesVendedores.map(t => ({ id: t.value, name: t.label, flow: 'Vendedores', category: 'result' as const, isCurrency: false })),
  ...resultTypesCompradores.map(t => ({ id: t.value, name: t.label, flow: 'Compradores', category: 'result' as const, isCurrency: false })),
  ...resultTypesRecrutamento.map(t => ({ id: t.value, name: t.label, flow: 'Recrutamento', category: 'result' as const, isCurrency: false })),
  ...resultTypesIntermediacao.map(t => ({ 
    id: t.value, 
    name: t.label, 
    flow: 'Crédito', 
    category: 'result' as const,
    isCurrency: t.value === 'comissoes_credito' 
  })),
  ...resultTypesGerais.map(t => ({ 
    id: t.value, 
    name: t.label, 
    flow: 'Geral', 
    category: 'result' as const,
    isCurrency: t.value.includes('faturacao') 
  })),
];

const activityObjectives = allObjectivesList.filter(o => o.category === 'activity');
const resultObjectives = allObjectivesList.filter(o => o.category === 'result');

interface AddResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResultDialog({ open, onOpenChange }: AddResultDialogProps) {
  const [objectiveId, setObjectiveId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const selectedObjective = allObjectivesList.find(o => o.id === objectiveId);
  const isResult = selectedObjective?.category === 'result';

  const handleSubmit = () => {
    if (!objectiveId || !value) {
      toast.error('Preencha o objetivo e o valor');
      return;
    }

    const objective = allObjectivesList.find(o => o.id === objectiveId);
    
    // TODO: Connect to database - save the result
    console.log('New entry:', { objectiveId, value, notes, date, category: objective?.category });
    
    const displayValue = objective?.isCurrency ? `€${value}` : `+${value}`;
    const actionType = objective?.category === 'result' ? 'Resultado' : 'Atividade';
    toast.success(`${actionType} registado: ${displayValue} em ${objective?.name}`);
    
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
      <DialogContent className="sm:max-w-md border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <Trophy className="h-5 w-5" />
            Registar Execução
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Registe atividades realizadas ou resultados concretizados que fazem avançar os seus objetivos.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="result-objective">Objetivo</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Selecione o objetivo: Atividade (esforço diário) ou Resultado (concretização)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger 
                id="result-objective" 
                className={cn(
                  "border-emerald-500/30 focus:ring-emerald-500/30",
                  objectiveId && isResult && "border-emerald-500 bg-emerald-500/5",
                  objectiveId && !isResult && "border-blue-500 bg-blue-500/5"
                )}
              >
                <SelectValue placeholder="Selecionar objetivo" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Activity Group */}
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 text-blue-600">
                    <Activity className="h-4 w-4" />
                    Atividade (Esforço)
                  </SelectLabel>
                  {activityObjectives.map((obj) => (
                    <SelectItem 
                      key={obj.id} 
                      value={obj.id}
                      className="focus:bg-blue-500/10 focus:text-blue-700 pl-6"
                    >
                      <span>{obj.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({obj.flow})</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                {/* Result Group */}
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 text-emerald-600 mt-2">
                    <Trophy className="h-4 w-4" />
                    Resultado (Concretização)
                  </SelectLabel>
                  {resultObjectives.map((obj) => (
                    <SelectItem 
                      key={obj.id} 
                      value={obj.id}
                      className="focus:bg-emerald-500/10 focus:text-emerald-700 pl-6"
                    >
                      <span>{obj.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({obj.flow})</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result-value">
              {selectedObjective?.isCurrency ? 'Valor (€)' : 'Quantidade'}
            </Label>
            <Input
              id="result-value"
              type="number"
              placeholder={selectedObjective?.isCurrency ? "Ex: 8500, 15000" : "Ex: 1, 2, 5"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={cn(
                isResult ? "border-emerald-500/30 focus:ring-emerald-500/30" : "border-blue-500/30 focus:ring-blue-500/30"
              )}
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
                    isResult ? "border-emerald-500/30" : "border-blue-500/30",
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
            <Label htmlFor="result-notes">Notas (opcional)</Label>
            <Textarea
              id="result-notes"
              placeholder="Descrição adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={cn(
                isResult ? "border-emerald-500/30 focus:ring-emerald-500/30" : "border-blue-500/30 focus:ring-blue-500/30"
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
