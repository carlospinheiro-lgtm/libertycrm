import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target } from 'lucide-react';
import { 
  Objective, 
  ObjectiveFlow, 
  getObjectiveTypeName, 
  objectiveCategoryLabels 
} from '@/types';

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
    targetName: 'João Silva',
    sourceFilter: 'all',
  },
  {
    id: '2',
    flow: 'vendedores',
    objectiveCategory: 'activity',
    activityType: 'leads_vendedores',
    currentValue: 18,
    targetValue: 20,
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
    currentValue: 16,
    targetValue: 20,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Todas',
    sourceFilter: 'all',
  },
  // Compradores - Atividade
  {
    id: '4',
    flow: 'compradores',
    objectiveCategory: 'activity',
    activityType: 'visitas',
    currentValue: 42,
    targetValue: 50,
    unit: 'number',
    unitSymbol: '',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31'),
    targetType: 'agency',
    targetName: 'Braga',
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
    targetName: 'Maria Santos',
    sourceFilter: 'all',
  },
  // Geral - Resultado
  {
    id: '6',
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

function formatValue(value: number, unit: string, unitSymbol: string): string {
  if (unit === 'currency') {
    return `${unitSymbol}${value.toLocaleString('pt-PT')}`;
  }
  return `${value.toLocaleString('pt-PT')}${unitSymbol ? ` ${unitSymbol}` : ''}`;
}

function getStatusBadge(percentage: number) {
  if (percentage >= 90) {
    return { label: 'No alvo', variant: 'success' as const };
  }
  if (percentage >= 70) {
    return { label: 'Em curso', variant: 'warning' as const };
  }
  return { label: 'Atenção', variant: 'destructive' as const };
}

function getProgressColor(percentage: number) {
  if (percentage >= 90) return 'bg-success';
  if (percentage >= 70) return 'bg-warning';
  return 'bg-destructive';
}

interface ObjectiveGroupProps {
  objectives: Objective[];
  category: 'activity' | 'result';
}

function ObjectiveGroup({ objectives, category }: ObjectiveGroupProps) {
  const filtered = objectives.filter(o => o.objectiveCategory === category);
  
  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Sem objetivos de {objectiveCategoryLabels[category].toLowerCase()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((obj) => {
        const percentage = Math.round((obj.currentValue / obj.targetValue) * 100);
        const status = getStatusBadge(percentage);
        const typeName = getObjectiveTypeName(obj);
        
        return (
          <div key={obj.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{typeName}</span>
              <Badge 
                variant={status.variant === 'success' ? 'default' : status.variant === 'warning' ? 'secondary' : 'destructive'}
                className={status.variant === 'success' ? 'bg-success text-success-foreground' : status.variant === 'warning' ? 'bg-warning text-warning-foreground' : ''}
              >
                {status.label}
              </Badge>
            </div>
            
            <div className="relative">
              <Progress value={0} className="h-2" />
              <div
                className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(percentage)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {formatValue(obj.currentValue, obj.unit, obj.unitSymbol)} / {formatValue(obj.targetValue, obj.unit, obj.unitSymbol)}
              </span>
              <span className="font-medium">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ObjectivesSummary() {
  const [selectedFlow, setSelectedFlow] = useState<ObjectiveFlow | 'all'>('vendedores');

  const filteredObjectives = selectedFlow === 'all' 
    ? objectivesMock 
    : objectivesMock.filter(o => o.flow === selectedFlow);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Target className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-heading">Resumo de Objetivos</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedFlow} onValueChange={(v) => setSelectedFlow(v as ObjectiveFlow | 'all')}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
            <TabsTrigger value="compradores">Compradores</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedFlow} className="space-y-4">
            {/* Activity Section */}
            {selectedFlow !== 'geral' && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Atividade
                </h4>
                <ObjectiveGroup objectives={filteredObjectives} category="activity" />
              </div>
            )}

            {/* Result Section */}
            <div className={selectedFlow !== 'geral' ? 'pt-4 border-t' : ''}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Resultado
              </h4>
              <ObjectiveGroup objectives={filteredObjectives} category="result" />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}