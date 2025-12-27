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

// Activity objectives list - ONLY ACTIVITY types
const activityObjectivesList = [
  // Vendedores
  { id: 'posicionamento_vendedores', name: 'Prospeção de Clientes', flow: 'Vendedores', tipo: 'atividade' as const },
  { id: 'leads_vendedores', name: 'Leads obtidas', flow: 'Vendedores', tipo: 'atividade' as const },
  { id: 'chamadas_vendedores', name: 'Chamadas realizadas', flow: 'Vendedores', tipo: 'atividade' as const },
  { id: 'contactos_efetivos_vendedores', name: 'Contactos efetivos', flow: 'Vendedores', tipo: 'atividade' as const },
  { id: 'apresentacoes_servicos', name: 'Apresentações de serviços', flow: 'Vendedores', tipo: 'atividade' as const },
  { id: 'seguimentos_vendedores', name: 'Seguimentos', flow: 'Vendedores', tipo: 'atividade' as const },
  // Compradores
  { id: 'posicionamento_compradores', name: 'Prospeção de Clientes', flow: 'Compradores', tipo: 'atividade' as const },
  { id: 'leads_compradores', name: 'Leads obtidas', flow: 'Compradores', tipo: 'atividade' as const },
  { id: 'qualificacao', name: 'Qualificações', flow: 'Compradores', tipo: 'atividade' as const },
  { id: 'visitas', name: 'Visitas realizadas', flow: 'Compradores', tipo: 'atividade' as const },
  { id: 'propostas', name: 'Propostas apresentadas', flow: 'Compradores', tipo: 'atividade' as const },
  // Recrutamento - 6 atividades completas
  { id: 'prospeccao_leads_recrutamento', name: 'Prospecção de Leads', flow: 'Recrutamento', tipo: 'atividade' as const },
  { id: 'leads_obtidas_recrutamento', name: 'Nº de Leads Obtidas', flow: 'Recrutamento', tipo: 'atividade' as const },
  { id: 'contactos_leads_recrutamento', name: 'Contactar Leads', flow: 'Recrutamento', tipo: 'atividade' as const },
  { id: 'marcar_entrevistas_recrutamento', name: 'Marcar Entrevistas', flow: 'Recrutamento', tipo: 'atividade' as const },
  { id: 'entrevistas_realizadas', name: 'Fazer Entrevistas', flow: 'Recrutamento', tipo: 'atividade' as const },
  { id: 'seguimentos_recrutamento', name: 'Seguir Leads Não Recrutadas', flow: 'Recrutamento', tipo: 'atividade' as const },
  // Intermediação de Crédito
  { id: 'simulacoes_credito', name: 'Simulações de crédito', flow: 'Crédito', tipo: 'atividade' as const },
  { id: 'processos_submetidos', name: 'Processos submetidos', flow: 'Crédito', tipo: 'atividade' as const },
  { id: 'aprovacoes_obtidas', name: 'Aprovações obtidas', flow: 'Crédito', tipo: 'atividade' as const },
];

// Group by flow
const activityByFlow = activityObjectivesList.reduce((acc, obj) => {
  if (!acc[obj.flow]) acc[obj.flow] = [];
  acc[obj.flow].push(obj);
  return acc;
}, {} as Record<string, typeof activityObjectivesList>);

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
      toast.error('Preencha o tipo de atividade e a quantidade');
      return;
    }

    const objective = activityObjectivesList.find(o => o.id === objectiveId);
    
    // TODO: Connect to database - save the activity
    console.log('New activity:', { objectiveId, value, notes, date, tipo: 'atividade' });
    
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
      <DialogContent className="sm:max-w-md border-blue-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Activity className="h-5 w-5" />
            Registar Atividade
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Registe atividades de esforço diário que fazem avançar os seus objetivos.
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
                    <p>Selecione o tipo de atividade que realizou: Prospeção, Leads, Chamadas, Visitas, etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger 
                id="activity-objective" 
                className="border-blue-500/30 focus:ring-blue-500/30"
              >
                <SelectValue placeholder="Selecionar atividade" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(activityByFlow).map(([flow, activities]) => (
                  <SelectGroup key={flow}>
                    <SelectLabel className="text-blue-600 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {flow}
                    </SelectLabel>
                    {activities.map((obj) => (
                      <SelectItem 
                        key={obj.id} 
                        value={obj.id}
                        className="focus:bg-blue-500/10 focus:text-blue-700 pl-6"
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
            <Label htmlFor="activity-value">Quantidade</Label>
            <Input
              id="activity-value"
              type="number"
              placeholder="Ex: 5, 10, 20"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="border-blue-500/30 focus:ring-blue-500/30"
            />
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal border-blue-500/30',
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
              className="border-blue-500/30 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
