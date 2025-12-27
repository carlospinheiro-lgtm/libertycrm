import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ObjectivesStats } from '@/components/objectives/ObjectivesStats';
import { ObjectivesTable } from '@/components/objectives/ObjectivesTable';
import { ResultsOverview } from '@/components/objectives/ResultsOverview';
import { ResultsTable } from '@/components/objectives/ResultsTable';
import { ResultsChart } from '@/components/objectives/ResultsChart';
import { AddObjectiveDialog } from '@/components/objectives/AddObjectiveDialog';
import { ObjectiveDetailsSheet } from '@/components/objectives/ObjectiveDetailsSheet';
import { AddResultDialog } from '@/components/dashboard/AddResultDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target } from 'lucide-react';
import { Objective, ObjectiveFlow } from '@/types';

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Objetivos & Performance
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhamento de metas e resultados
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="braga">Braga</SelectItem>
                <SelectItem value="barcelos">Barcelos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Atual</SelectItem>
                <SelectItem value="q4">Q4 2024</SelectItem>
                <SelectItem value="q3">Q3 2024</SelectItem>
                <SelectItem value="year">Ano 2024</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => setAddResultOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Resultado
            </Button>
            
            <Button onClick={() => setAddObjectiveOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Objetivo
            </Button>
          </div>
        </div>

        {/* Tabs by Flow */}
        <Tabs value={flowFilter} onValueChange={(v) => setFlowFilter(v as ObjectiveFlow | 'all')}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
            <TabsTrigger value="compradores">Compradores</TabsTrigger>
            <TabsTrigger value="recrutamento">Recrutamento</TabsTrigger>
            <TabsTrigger value="intermediacao_credito">Interm. Crédito</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>

          <TabsContent value={flowFilter} className="mt-6 space-y-6">
            {/* Stats Grid - Activity */}
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
              objectives={filteredObjectives.filter(o => o.objectiveCategory === 'activity')} 
              onViewDetails={handleViewDetails}
              title="Objetivos de Atividade"
            />
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