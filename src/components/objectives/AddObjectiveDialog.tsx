import { useState, useMemo } from 'react';
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ObjectiveFlow,
  ObjectiveCategory,
  ActivityObjectiveType,
  ResultObjectiveType,
  ObjectiveUnit,
  activityTypesVendedores,
  activityTypesCompradores,
  activityTypesRecrutamento,
  activityTypesIntermediacao,
  resultTypesVendedores,
  resultTypesCompradores,
  resultTypesRecrutamento,
  resultTypesIntermediacao,
  objectiveUnits,
  defaultSources,
  sourceTypeLabels,
  SourceType,
} from '@/types';

interface AddObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock agents - TODO: Connect to database
const mockAgents = [
  { id: 'agent-1', name: 'João Silva', agency: 'braga' },
  { id: 'agent-2', name: 'Maria Santos', agency: 'barcelos' },
  { id: 'agent-3', name: 'Pedro Costa', agency: 'braga' },
];

const mockAgencies = [
  { id: 'braga', name: 'Braga' },
  { id: 'barcelos', name: 'Barcelos' },
];

export function AddObjectiveDialog({ open, onOpenChange }: AddObjectiveDialogProps) {
  const [flow, setFlow] = useState<ObjectiveFlow | ''>('');
  const [objectiveCategory, setObjectiveCategory] = useState<ObjectiveCategory | ''>('');
  const [objectiveType, setObjectiveType] = useState<string>('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState<ObjectiveUnit>('number');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [targetType, setTargetType] = useState<'agent' | 'agency' | ''>('');
  const [targetId, setTargetId] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType | 'all'>('all');

  // Get available objective types based on flow and category
  const availableTypes = useMemo(() => {
    if (!flow || !objectiveCategory) return [];
    
    if (objectiveCategory === 'activity') {
      if (flow === 'vendedores') return activityTypesVendedores;
      if (flow === 'compradores') return activityTypesCompradores;
      if (flow === 'recrutamento') return activityTypesRecrutamento;
      if (flow === 'intermediacao_credito') return activityTypesIntermediacao;
      return [];
    }
    
    if (objectiveCategory === 'result') {
      if (flow === 'vendedores') return resultTypesVendedores;
      if (flow === 'compradores') return resultTypesCompradores;
      if (flow === 'recrutamento') return resultTypesRecrutamento;
      if (flow === 'intermediacao_credito') return resultTypesIntermediacao;
      // 'geral' flow no longer has specific result types - use vendedores as default
      if (flow === 'geral') return resultTypesVendedores;
      return [];
    }
    
    return [];
  }, [flow, objectiveCategory]);

  // Get available sources for filter
  const availableSources = useMemo(() => {
    if (!flow || flow === 'geral') return defaultSources;
    return defaultSources.filter(s => s.flow === flow || s.flow === 'ambos');
  }, [flow]);

  const handleSubmit = () => {
    if (!flow || !objectiveCategory || !objectiveType || !targetValue || !unit || !startDate || !endDate || !targetType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (targetType === 'agent' && !targetId) {
      toast.error('Selecione um agente');
      return;
    }

    if (targetType === 'agency' && !targetId) {
      toast.error('Selecione uma agência');
      return;
    }

    const selectedUnit = objectiveUnits.find(u => u.value === unit);
    const targetName = targetType === 'agent' 
      ? mockAgents.find(a => a.id === targetId)?.name 
      : mockAgencies.find(a => a.id === targetId)?.name;

    // TODO: Connect to database
    const newObjective = {
      flow,
      objectiveCategory,
      activityType: objectiveCategory === 'activity' ? objectiveType as ActivityObjectiveType : undefined,
      resultType: objectiveCategory === 'result' ? objectiveType as ResultObjectiveType : undefined,
      targetValue: parseFloat(targetValue),
      currentValue: 0,
      unit,
      unitSymbol: selectedUnit?.symbol || '',
      startDate,
      endDate,
      targetType,
      targetId,
      targetName,
      sourceFilter: sourceFilter === 'all' ? 'all' : [sourceFilter],
    };

    console.log('New objective:', newObjective);
    toast.success('Objetivo criado com sucesso');
    
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFlow('');
    setObjectiveCategory('');
    setObjectiveType('');
    setTargetValue('');
    setUnit('number');
    setStartDate(undefined);
    setEndDate(undefined);
    setTargetType('');
    setTargetId('');
    setSourceFilter('all');
    setSourceTypeFilter('all');
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  // Reset objective type when flow or category changes
  const handleFlowChange = (value: ObjectiveFlow) => {
    setFlow(value);
    setObjectiveType('');
  };

  const handleCategoryChange = (value: ObjectiveCategory) => {
    setObjectiveCategory(value);
    setObjectiveType('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo Objetivo</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Flow and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Fluxo *</Label>
              <Select value={flow} onValueChange={handleFlowChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedores">Vendedores</SelectItem>
                  <SelectItem value="compradores">Compradores</SelectItem>
                  <SelectItem value="recrutamento">Recrutamento</SelectItem>
                  <SelectItem value="intermediacao_credito">Interm. Crédito</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Categoria *</Label>
              <Select 
                value={objectiveCategory} 
                onValueChange={handleCategoryChange}
                disabled={!flow || (flow === 'geral' && objectiveCategory !== 'result')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {flow !== 'geral' && (
                    <SelectItem value="activity">Atividade</SelectItem>
                  )}
                  <SelectItem value="result">Resultado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objective Type (controlled list) */}
          <div className="grid gap-2">
            <Label>Tipo *</Label>
            <Select 
              value={objectiveType} 
              onValueChange={setObjectiveType}
              disabled={availableTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={availableTypes.length > 0 ? "Selecionar tipo" : "Selecione fluxo e categoria primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="grid gap-2">
              <Label>Unidade *</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as ObjectiveUnit)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {objectiveUnits.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment Type and Target */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Atribuição *</Label>
              <Select value={targetType} onValueChange={(v) => { setTargetType(v as 'agent' | 'agency'); setTargetId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="agency">Agência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{targetType === 'agent' ? 'Agente *' : targetType === 'agency' ? 'Agência *' : 'Pessoa/Agência'}</Label>
              <Select 
                value={targetId} 
                onValueChange={setTargetId}
                disabled={!targetType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={targetType ? "Selecionar" : "Escolha atribuição primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {targetType === 'agent' && mockAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                  {targetType === 'agency' && mockAgencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data Início *</Label>
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
              <Label>Data Fim *</Label>
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

          {/* Source Filters (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Origem (opcional)</Label>
              <Select value={sourceTypeFilter} onValueChange={(v) => setSourceTypeFilter(v as SourceType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(sourceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Origem específica (opcional)</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Origens disponíveis</SelectLabel>
                    {availableSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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