import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ObjectivesStats } from '@/components/objectives/ObjectivesStats';
import { ObjectivesTable } from '@/components/objectives/ObjectivesTable';
import { ResultsOverview } from '@/components/objectives/ResultsOverview';
import { ResultsTable } from '@/components/objectives/ResultsTable';
import { ResultsChart } from '@/components/objectives/ResultsChart';
import { MobileResultsSummary } from '@/components/objectives/MobileResultsSummary';
import { AddObjectiveDialog } from '@/components/objectives/AddObjectiveDialog';
import { ObjectiveDetailsSheet } from '@/components/objectives/ObjectiveDetailsSheet';
import { AddResultDialog } from '@/components/dashboard/AddResultDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Trophy, Activity } from 'lucide-react';
import { Objective, ObjectiveFlow } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
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
  // Geral - Resultado
  {
    id: '10',
    flow: 'geral',
    objectiveCategory: 'result',
    resultType: 'transacao_venda',
    currentValue: 6,
    targetValue: 10,
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
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('current');
  const [flowFilter, setFlowFilter] = useState<ObjectiveFlow | 'all'>('all');
  const [mobileView, setMobileView] = useState<'results' | 'activity'>('results');
  const isMobile = useIsMobile();

  const handleViewDetails = (objective: Objective) => {
    setSelectedObjective(objective);
    setDetailsOpen(true);
  };

  const filteredObjectives = objectivesMock.filter(obj => {
    if (flowFilter !== 'all' && obj.flow !== flowFilter) return false;
    return true;
  });

  const resultObjectives = filteredObjectives.filter(o => o.objectiveCategory === 'result');
  const activityObjectives = filteredObjectives.filter(o => o.objectiveCategory === 'activity');

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
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-[110px] md:w-[140px] h-9">
                <SelectValue placeholder="Agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="braga">Braga</SelectItem>
                <SelectItem value="barcelos">Barcelos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[100px] md:w-[140px] h-9">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Atual</SelectItem>
                <SelectItem value="q4">Q4 2024</SelectItem>
                <SelectItem value="q3">Q3 2024</SelectItem>
                <SelectItem value="year">Ano 2024</SelectItem>
              </SelectContent>
            </Select>
            
            {!isMobile && (
              <>
                <Button variant="outline" onClick={() => setAddResultOpen(true)} size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-1" />
                  Resultado
                </Button>
                
                <Button onClick={() => setAddObjectiveOpen(true)} size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-1" />
                  Objetivo
                </Button>
              </>
            )}
            
            {isMobile && (
              <Button onClick={() => setAddObjectiveOpen(true)} size="sm" className="h-9">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile: Sticky Toggle */}
        {isMobile && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-2 border-b">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setMobileView('results')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  mobileView === 'results' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trophy className="h-4 w-4" />
                Resultados
              </button>
              <button
                onClick={() => setMobileView('activity')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  mobileView === 'activity' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Activity className="h-4 w-4" />
                Atividade
              </button>
            </div>
          </div>
        )}

        {/* Flow Tabs - Horizontal scrollable on mobile */}
        <Tabs value={flowFilter} onValueChange={(v) => setFlowFilter(v as ObjectiveFlow | 'all')}>
          <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-max md:w-auto">
              <TabsTrigger value="all" className="text-xs md:text-sm">Todos</TabsTrigger>
              <TabsTrigger value="vendedores" className="text-xs md:text-sm">Vendedores</TabsTrigger>
              <TabsTrigger value="compradores" className="text-xs md:text-sm">Compradores</TabsTrigger>
              <TabsTrigger value="recrutamento" className="text-xs md:text-sm">Recrutamento</TabsTrigger>
              <TabsTrigger value="intermediacao_credito" className="text-xs md:text-sm">Crédito</TabsTrigger>
              <TabsTrigger value="geral" className="text-xs md:text-sm">Geral</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={flowFilter} className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            {/* Mobile View */}
            {isMobile ? (
              <>
                {mobileView === 'results' ? (
                  <div className="space-y-4">
                    <MobileResultsSummary objectives={filteredObjectives} />
                    <ResultsTable 
                      objectives={filteredObjectives} 
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Activity Stats Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold">{activityObjectives.length}</p>
                        <p className="text-xs text-muted-foreground">Objetivos</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {activityObjectives.filter(o => (o.currentValue / o.targetValue) >= 0.9).length}
                        </p>
                        <p className="text-xs text-muted-foreground">No Alvo</p>
                      </div>
                    </div>
                    <ObjectivesTable 
                      objectives={activityObjectives} 
                      onViewDetails={handleViewDetails}
                      title="Objetivos de Atividade"
                    />
                  </div>
                )}
              </>
            ) : (
              /* Desktop View */
              <>
                {/* Stats Grid */}
                <ObjectivesStats objectives={filteredObjectives} />

                {/* Results Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <ResultsOverview objectives={filteredObjectives} />
                  <ResultsChart objectives={filteredObjectives} />
                </div>

                {/* Results Table */}
                <ResultsTable 
                  objectives={filteredObjectives} 
                  onViewDetails={handleViewDetails}
                />

                {/* Activity Table */}
                <ObjectivesTable 
                  objectives={activityObjectives} 
                  onViewDetails={handleViewDetails}
                  title="Objetivos de Atividade"
                />
              </>
            )}
          </TabsContent>
        </Tabs>
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
      
      <ObjectiveDetailsSheet 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen}
        objective={selectedObjective}
      />
    </DashboardLayout>
  );
}
