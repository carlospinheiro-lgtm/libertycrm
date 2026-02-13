import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResultTypeGrid } from '@/components/objectives/ResultTypeGrid';
import { ActivityTypeGrid } from '@/components/objectives/ActivityTypeGrid';
import { AddObjectiveDialog } from '@/components/objectives/AddObjectiveDialog';
import { ObjectiveDetailsSheet } from '@/components/objectives/ObjectiveDetailsSheet';
import { AddResultDialog } from '@/components/dashboard/AddResultDialog';
import { AddActivityDialog } from '@/components/objectives/AddActivityDialog';
import { AllObjectivesDialog } from '@/components/objectives/AllObjectivesDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Target, Trophy, Activity, Filter, CalendarIcon, ClipboardList } from 'lucide-react';
import { Objective, ObjectiveFlow } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useObjectives, DbObjective } from '@/hooks/useObjectives';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to convert DB objectives to UI format
function dbToUiObjective(db: DbObjective): Objective {
  return {
    id: db.id,
    flow: db.flow,
    objectiveCategory: db.objective_category as any,
    activityType: db.activity_type as any,
    resultType: db.result_type as any,
    currentValue: Number(db.current_value),
    targetValue: Number(db.target_value),
    unit: db.unit as any,
    unitSymbol: db.unit_symbol,
    startDate: new Date(db.start_date),
    endDate: new Date(db.end_date),
    targetType: db.target_type as any,
    targetId: db.target_id || undefined,
    targetName: db.target_name || undefined,
    sourceFilter: db.source_filter === 'all' ? 'all' : db.source_filter,
  };
}

export default function Objetivos() {
  const { objectives: dbObjectives, isLoading } = useObjectives();
  const [addObjectiveOpen, setAddObjectiveOpen] = useState(false);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [allObjectivesOpen, setAllObjectivesOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [flowFilter, setFlowFilter] = useState<ObjectiveFlow | 'all'>('all');
  const isMobile = useIsMobile();

  // Convert DB objectives to UI format
  const allObjectives: Objective[] = dbObjectives.map(dbToUiObjective);

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

  const filteredObjectives = allObjectives.filter(obj => {
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
          {/* Ver todos os objetivos - CINZA FIXO */}
          <Button 
            onClick={() => setAllObjectivesOpen(true)} 
            size={isMobile ? "sm" : "default"}
            className="bg-gray-600 hover:bg-gray-700 text-white border-0"
          >
            <ClipboardList className="h-4 w-4 mr-1.5" />
            {isMobile ? "Ver todos" : "Ver todos os objetivos"}
          </Button>

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

      <AllObjectivesDialog
        open={allObjectivesOpen}
        onOpenChange={setAllObjectivesOpen}
        objectives={allObjectives}
        onViewDetails={handleViewDetails}
      />
    </DashboardLayout>
  );
}
