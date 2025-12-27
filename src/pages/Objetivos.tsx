import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ObjectivesStats } from '@/components/objectives/ObjectivesStats';
import { ObjectivesTable } from '@/components/objectives/ObjectivesTable';
import { AddObjectiveDialog } from '@/components/objectives/AddObjectiveDialog';
import { ObjectiveDetailsSheet } from '@/components/objectives/ObjectiveDetailsSheet';
import { AddResultDialog } from '@/components/dashboard/AddResultDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target } from 'lucide-react';
import { Objective } from '@/types';

// Mock data - TODO: Connect to database
const objectivesMock: Objective[] = [
  {
    id: '1',
    name: 'Faturação Trimestral Q4',
    currentValue: 125000,
    targetValue: 150000,
    unit: '€',
    type: 'currency',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    id: '2',
    name: 'Novas Angariações',
    currentValue: 18,
    targetValue: 20,
    unit: '',
    type: 'number',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    id: '3',
    name: 'Leads Qualificadas',
    currentValue: 42,
    targetValue: 60,
    unit: '',
    type: 'number',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    id: '4',
    name: 'Pontos de Equipa',
    currentValue: 8500,
    targetValue: 10000,
    unit: 'pts',
    type: 'points',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    id: '5',
    name: 'Taxa de Conversão',
    currentValue: 28,
    targetValue: 35,
    unit: '%',
    type: 'percentage',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
  },
  {
    id: '6',
    name: 'Reservas Mensais',
    currentValue: 5,
    targetValue: 8,
    unit: '',
    type: 'number',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
  },
];

export default function Objetivos() {
  const [addObjectiveOpen, setAddObjectiveOpen] = useState(false);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('current');

  const handleViewDetails = (objective: Objective) => {
    setSelectedObjective(objective);
    setDetailsOpen(true);
  };

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
                <SelectItem value="porto">Porto</SelectItem>
                <SelectItem value="lisboa">Lisboa</SelectItem>
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

        {/* Stats Grid */}
        <ObjectivesStats objectives={objectivesMock} />

        {/* Objectives Table */}
        <ObjectivesTable 
          objectives={objectivesMock} 
          onViewDetails={handleViewDetails}
        />
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
