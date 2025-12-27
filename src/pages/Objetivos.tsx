import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResultTypeGrid } from '@/components/objectives/ResultTypeGrid';
import { ActivityTypeGrid } from '@/components/objectives/ActivityTypeGrid';
import { AddObjectiveDialog } from '@/components/objectives/AddObjectiveDialog';
import { ObjectiveDetailsSheet } from '@/components/objectives/ObjectiveDetailsSheet';
import { AddResultDialog } from '@/components/dashboard/AddResultDialog';
import { AddActivityDialog } from '@/components/objectives/AddActivityDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Target, Trophy, Activity, Filter, CalendarIcon } from 'lucide-react';
import { Objective, ObjectiveFlow } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Mock data - TODO: Connect to database
const objectivesMock: Objective[] = [
  // Vendedores - Atividade
  {
    id: '1',
    flow: 'vendedores',
    objectiveCategory: 'activity',
    activityType: 'posicionamento_vendedores',
    currentValue: 45,
    targetValue: 60,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agent',
    targetId: 'agent-1',
    targetName: 'João Silva',
    sourceFilter: ['2', '3'],
  },
  {
    id: '2',
    flow: 'vendedores',
    objectiveCategory: 'activity',
    activityType: 'leads_vendedores',
    currentValue: 18,
    targetValue: 25,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Braga',
    sourceFilter: 'all',
  },
  // Vendedores - Resultado
  {
    id: '3',
    flow: 'vendedores',
    objectiveCategory: 'result',
    resultType: 'angariacao_reservada',
    currentValue: 8,
    targetValue: 10,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agent',
    targetId: 'agent-1',
    targetName: 'João Silva',
    sourceFilter: 'all',
  },
  // Compradores - Atividade
  {
    id: '4',
    flow: 'compradores',
    objectiveCategory: 'activity',
    activityType: 'visitas',
    currentValue: 32,
    targetValue: 50,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agent',
    targetId: 'agent-2',
    targetName: 'Maria Santos',
    sourceFilter: 'all',
  },
  // Compradores - Resultado
  {
    id: '5',
    flow: 'compradores',
    objectiveCategory: 'result',
    resultType: 'reserva_comprador',
    currentValue: 5,
    targetValue: 8,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agent',
    targetId: 'agent-2',
    targetName: 'Maria Santos',
    sourceFilter: 'all',
  },
  // Recrutamento - Atividade
  {
    id: '6',
    flow: 'recrutamento',
    objectiveCategory: 'activity',
    activityType: 'entrevistas_realizadas',
    currentValue: 12,
    targetValue: 20,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Braga',
    sourceFilter: 'all',
  },
  // Recrutamento - Resultado
  {
    id: '7',
    flow: 'recrutamento',
    objectiveCategory: 'result',
    resultType: 'consultores_integrados',
    currentValue: 3,
    targetValue: 5,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  // Intermediação de Crédito - Atividade
  {
    id: '8',
    flow: 'intermediacao_credito',
    objectiveCategory: 'activity',
    activityType: 'simulacoes_credito',
    currentValue: 25,
    targetValue: 40,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  // Intermediação de Crédito - Resultado
  {
    id: '9',
    flow: 'intermediacao_credito',
    objectiveCategory: 'result',
    resultType: 'creditos_formalizados',
    currentValue: 8,
    targetValue: 15,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  // Vendedores - Angariações Exclusivo
  {
    id: '10',
    flow: 'vendedores',
    objectiveCategory: 'result',
    resultType: 'angariacao_exclusiva',
    currentValue: 8,
    targetValue: 12,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  // Vendedores - Angariações Exclusivo de Rede
  {
    id: '10b',
    flow: 'vendedores',
    objectiveCategory: 'result',
    resultType: 'angariacao_exclusiva_rede',
    currentValue: 5,
    targetValue: 8,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  {
    id: '11',
    flow: 'geral',
    objectiveCategory: 'result',
    resultType: 'faturacao_vendas',
    currentValue: 125000,
    targetValue: 150000,
    unit: 'currency',
    unitSymbol: '€',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
];

export default function Objetivos() {
  const [addObjectiveOpen, setAddObjectiveOpen] = useState(false);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [flowFilter, setFlowFilter] = useState<ObjectiveFlow | 'all'>('all');
  const isMobile = useIsMobile();

  // Calculate date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'last_3_months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last_6_months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: customDateRange.from, end: customDateRange.to };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'this_month': return 'Este mês';
      case 'last_month': return 'Mês anterior';
      case 'last_3_months': return 'Últimos 3 meses';
      case 'last_6_months': return 'Últimos 6 meses';
      case 'this_year': return 'Ano atual';
      case 'custom': 
        if (customDateRange.from && customDateRange.to) {
          return `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM')}`;
        }
        return 'Personalizado';
      default: return 'Período';
    }
  };

  const handleViewDetails = (objective: Objective) => {
    setSelectedObjective(objective);
    setDetailsOpen(true);
  };

  const filteredObjectives = objectivesMock.filter(obj => {
    if (flowFilter !== 'all' && obj.flow !== flowFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-heading flex items-center gap-2">
              <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Objetivos & Performance
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 md:mt-1 hidden md:block">
              Acompanhamento de metas e resultados
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Filters */}
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-[100px] md:w-[140px] h-9">
                <SelectValue placeholder="Agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="braga">Braga</SelectItem>
                <SelectItem value="barcelos">Barcelos</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[120px] md:w-[160px] h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{getPeriodLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 space-y-1 border-b">
                  <Button 
                    variant={periodFilter === 'this_month' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setPeriodFilter('this_month')}
                  >
                    Este mês
                  </Button>
                  <Button 
                    variant={periodFilter === 'last_month' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setPeriodFilter('last_month')}
                  >
                    Mês anterior
                  </Button>
                  <Button 
                    variant={periodFilter === 'last_3_months' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setPeriodFilter('last_3_months')}
                  >
                    Últimos 3 meses
                  </Button>
                  <Button 
                    variant={periodFilter === 'last_6_months' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setPeriodFilter('last_6_months')}
                  >
                    Últimos 6 meses
                  </Button>
                  <Button 
                    variant={periodFilter === 'this_year' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start text-sm h-8"
                    onClick={() => setPeriodFilter('this_year')}
                  >
                    Ano atual
                  </Button>
                </div>
                <div className="p-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Período personalizado:</p>
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => {
                      setCustomDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        setPeriodFilter('custom');
                      }
                    }}
                    numberOfMonths={1}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Flow Filter */}
            <Select value={flowFilter} onValueChange={(v) => setFlowFilter(v as ObjectiveFlow | 'all')}>
              <SelectTrigger className="w-[100px] md:w-[150px] h-9">
                <Filter className="h-4 w-4 mr-1 md:mr-2 shrink-0" />
                <SelectValue placeholder="Fluxo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Fluxos</SelectItem>
                <SelectItem value="vendedores">Vendedores</SelectItem>
                <SelectItem value="compradores">Compradores</SelectItem>
                <SelectItem value="recrutamento">Recrutamento</SelectItem>
                <SelectItem value="intermediacao_credito">Crédito</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons - Fixed Colors */}
        <div className="flex flex-wrap gap-2">
          {/* + Objetivo - VERMELHO */}
          <Button 
            onClick={() => setAddObjectiveOpen(true)} 
            size={isMobile ? "sm" : "default"}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Target className="h-4 w-4 mr-1.5" />
            + Objetivo
          </Button>
          
          {/* + Atividade - AZUL */}
          <Button 
            onClick={() => setAddActivityOpen(true)} 
            size={isMobile ? "sm" : "default"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Activity className="h-4 w-4 mr-1.5" />
            + Atividade
          </Button>
          
          {/* + Resultado - VERDE */}
          <Button 
            onClick={() => setAddResultOpen(true)} 
            size={isMobile ? "sm" : "default"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Trophy className="h-4 w-4 mr-1.5" />
            + Resultado
          </Button>
        </div>

        {/* Main Content - Two Blocks */}
        <div className="space-y-6">
          {/* Block 1: Objetivos de Atividade (AZUL) */}
          <ActivityTypeGrid objectives={filteredObjectives} flowFilter={flowFilter} />
          
          {/* Block 2: Objetivos de Resultado (VERDE) */}
          <ResultTypeGrid objectives={filteredObjectives} flowFilter={flowFilter} />
        </div>
      </div>

      {/* Dialogs */}
      <AddObjectiveDialog 
        open={addObjectiveOpen} 
        onOpenChange={setAddObjectiveOpen} 
      />
      
      <AddResultDialog 
        open={addResultOpen} 
        onOpenChange={setAddResultOpen} 
      />

      <AddActivityDialog 
        open={addActivityOpen} 
        onOpenChange={setAddActivityOpen} 
      />
      
      <ObjectiveDetailsSheet
        open={detailsOpen} 
        onOpenChange={setDetailsOpen}
        objective={selectedObjective}
      />
    </DashboardLayout>
  );
}
