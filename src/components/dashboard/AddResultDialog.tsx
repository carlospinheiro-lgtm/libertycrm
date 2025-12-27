import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Trophy, HelpCircle } from 'lucide-react';
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
  SelectLabel,
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

// Result objectives list - ONLY RESULT types
// UPDATED: Removed transações, faturação is now derived (not selectable directly)
// Commission is required for reservas and angariação reservada
const resultObjectivesList = [
  // Vendedores - Angariações (selecionáveis)
  { id: 'angariacao_exclusiva', name: 'Angariações (Exclusivo)', flow: 'Vendedores', tipo: 'resultado' as const, isCurrency: false, requiresCommission: false },
  { id: 'angariacao_exclusiva_rede', name: 'Angariações (Exclusivo de Rede)', flow: 'Vendedores', tipo: 'resultado' as const, isCurrency: false, requiresCommission: false },
  { id: 'angariacao_reservada', name: 'Angariações Reservadas', flow: 'Vendedores', tipo: 'resultado' as const, isCurrency: false, requiresCommission: true, faturacaoType: 'venda' as const },
  // Compradores - Reservas (requerem comissão)
  { id: 'reserva_venda', name: 'Reserva de Venda', flow: 'Compradores', tipo: 'resultado' as const, isCurrency: false, requiresCommission: true, faturacaoType: 'venda' as const },
  { id: 'reserva_arrendamento', name: 'Reserva de Arrendamento', flow: 'Compradores', tipo: 'resultado' as const, isCurrency: false, requiresCommission: true, faturacaoType: 'arrendamento' as const },
  // Recrutamento
  { id: 'consultores_integrados', name: 'Recrutamentos concretizados', flow: 'Recrutamento', tipo: 'resultado' as const, isCurrency: false, requiresCommission: false },
  // Intermediação de Crédito
  { id: 'creditos_formalizados', name: 'Créditos aprovados', flow: 'Crédito', tipo: 'resultado' as const, isCurrency: false, requiresCommission: false },
  // REMOVED: transacao_venda, transacao_arrendamento
  // REMOVED from dropdown: faturacao_vendas, faturacao_arrendamentos (derived automatically)
];

// Group by flow
const resultsByFlow = resultObjectivesList.reduce((acc, obj) => {
  if (!acc[obj.flow]) acc[obj.flow] = [];
  acc[obj.flow].push(obj);
  return acc;
}, {} as Record<string, typeof resultObjectivesList>);

interface AddResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResultDialog({ open, onOpenChange }: AddResultDialogProps) {
  const [objectiveId, setObjectiveId] = useState('');
  const [value, setValue] = useState('');
  const [commission, setCommission] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const selectedObjective = resultObjectivesList.find(o => o.id === objectiveId);
  const requiresCommission = selectedObjective?.requiresCommission ?? false;

  const handleSubmit = () => {
    if (!objectiveId || !value) {
      toast.error('Preencha o tipo de resultado e o valor');
      return;
    }

    const objective = resultObjectivesList.find(o => o.id === objectiveId);
    
    // Validate commission is required
    if (objective?.requiresCommission && !commission) {
      toast.error('O valor da comissão é obrigatório para este tipo de resultado');
      return;
    }
    
    // TODO: Connect to database - save the result
    console.log('New result:', { objectiveId, value, commission, notes, date, tipo: 'resultado' });
    
    // If has commission, automatically associate to faturação
    if (commission && objective?.requiresCommission && objective.faturacaoType) {
      const faturacaoType = objective.faturacaoType === 'arrendamento' 
        ? 'faturacao_arrendamentos' 
        : 'faturacao_vendas';
      
      console.log('Faturação automática:', { faturacaoType, value: commission });
      toast.success(`Comissão de €${commission} associada automaticamente à Faturação`);
    }
    
    const displayValue = objective?.isCurrency ? `€${value}` : `+${value}`;
    toast.success(`Resultado registado: ${displayValue} em ${objective?.name}`);
    
    // Reset form
    setObjectiveId('');
    setValue('');
    setCommission('');
    setNotes('');
    setDate(new Date());
    onOpenChange(false);
  };

  const handleCancel = () => {
    setObjectiveId('');
    setValue('');
    setCommission('');
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
            Registar Resultado
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Registe resultados concretizados: reservas, angariações, transações, faturação.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="result-objective">Tipo de Resultado</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Selecione o tipo de resultado: Reservas, Angariações, Transações, Faturação, etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger 
                id="result-objective" 
                className="border-emerald-500/30 focus:ring-emerald-500/30"
              >
                <SelectValue placeholder="Selecionar resultado" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(resultsByFlow).map(([flow, results]) => (
                  <SelectGroup key={flow}>
                    <SelectLabel className="text-emerald-600 flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {flow}
                    </SelectLabel>
                    {results.map((obj) => (
                      <SelectItem 
                        key={obj.id} 
                        value={obj.id}
                        className="focus:bg-emerald-500/10 focus:text-emerald-700 pl-6"
                      >
                        {obj.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
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
              className="border-emerald-500/30 focus:ring-emerald-500/30"
            />
          </div>

          {/* Campo de comissão obrigatório para Reservas e Angariações Reservadas */}
          {requiresCommission && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="commission-value" className="text-emerald-700 font-medium">
                  Valor da Comissão (€) *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-emerald-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>A comissão será automaticamente associada ao cartão de Faturação correspondente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="commission-value"
                type="number"
                placeholder="Ex: 8500, 15000"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
                className="border-emerald-600 focus:ring-emerald-600 bg-emerald-50/50"
              />
              <p className="text-xs text-emerald-600/80">
                Este valor será somado automaticamente à Faturação ({selectedObjective?.faturacaoType === 'arrendamento' ? 'Arrendamentos' : 'Vendas'})
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-emerald-500/30',
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
              className="border-emerald-500/30 focus:ring-emerald-500/30"
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
