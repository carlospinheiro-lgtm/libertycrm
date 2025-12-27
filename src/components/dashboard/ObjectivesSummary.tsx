import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

// Mock data - TODO: Connect to database
const objectivesMock = [
  {
    id: '1',
    name: 'Faturação Trimestral Q4',
    currentValue: 125000,
    targetValue: 150000,
    unit: '€',
    type: 'currency' as const,
  },
  {
    id: '2',
    name: 'Novas Angariações',
    currentValue: 18,
    targetValue: 20,
    unit: '',
    type: 'number' as const,
  },
  {
    id: '3',
    name: 'Leads Qualificadas',
    currentValue: 42,
    targetValue: 60,
    unit: '',
    type: 'number' as const,
  },
  {
    id: '4',
    name: 'Pontos de Equipa',
    currentValue: 8500,
    targetValue: 10000,
    unit: 'pts',
    type: 'points' as const,
  },
];

function formatValue(value: number, type: string, unit: string): string {
  if (type === 'currency') {
    return `${unit}${value.toLocaleString('pt-PT')}`;
  }
  return `${value.toLocaleString('pt-PT')}${unit ? ` ${unit}` : ''}`;
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

export function ObjectivesSummary() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-heading">Resumo de Objetivos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {objectivesMock.map((obj) => {
            const percentage = Math.round((obj.currentValue / obj.targetValue) * 100);
            const status = getStatusBadge(percentage);
            
            return (
              <div key={obj.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{obj.name}</span>
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
                    {formatValue(obj.currentValue, obj.type, obj.unit)} / {formatValue(obj.targetValue, obj.type, obj.unit)}
                  </span>
                  <span className="font-medium">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
