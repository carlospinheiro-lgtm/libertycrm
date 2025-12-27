import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import { Objective, getObjectiveTypeName, objectiveFlowLabels } from '@/types';
import { cn } from '@/lib/utils';

interface MobileObjectiveCardProps {
  objective: Objective;
  onViewDetails?: (objective: Objective) => void;
  showCategory?: boolean;
}

export function MobileObjectiveCard({ objective, onViewDetails, showCategory = false }: MobileObjectiveCardProps) {
  const percentage = Math.round((objective.currentValue / objective.targetValue) * 100);
  const falta = Math.max(0, objective.targetValue - objective.currentValue);
  const typeName = getObjectiveTypeName(objective);
  
  const getStatusBadge = () => {
    if (percentage >= 100) return { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-600' };
    if (percentage >= 90) return { label: 'No Alvo', color: 'bg-emerald-500/10 text-emerald-600' };
    if (percentage >= 70) return { label: 'Em Curso', color: 'bg-amber-500/10 text-amber-600' };
    return { label: 'Atenção', color: 'bg-red-500/10 text-red-600' };
  };
  
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getFlowBadgeColor = (flow: string) => {
    switch (flow) {
      case 'vendedores': return 'bg-blue-500/10 text-blue-600';
      case 'compradores': return 'bg-purple-500/10 text-purple-600';
      case 'recrutamento': return 'bg-teal-500/10 text-teal-600';
      case 'intermediacao_credito': return 'bg-orange-500/10 text-orange-600';
      case 'geral': return 'bg-gray-500/10 text-gray-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const formatValue = (value: number) => {
    if (objective.unit === 'currency') {
      return new Intl.NumberFormat('pt-PT', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(value);
    }
    return value.toString();
  };
  
  const status = getStatusBadge();

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all active:scale-[0.98]",
        onViewDetails && "hover:bg-muted/50"
      )}
      onClick={() => onViewDetails?.(objective)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{typeName}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", getFlowBadgeColor(objective.flow))}>
                {objectiveFlowLabels[objective.flow]}
              </Badge>
              {showCategory && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {objective.objectiveCategory === 'result' ? 'Resultado' : 'Atividade'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={cn("text-xs", status.color)}>
              {status.label}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Values Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3 bg-muted/30 rounded-lg py-2">
          <div>
            <p className="text-xs text-muted-foreground">Definido</p>
            <p className="font-semibold text-sm">{formatValue(objective.targetValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Realizado</p>
            <p className="font-semibold text-sm text-emerald-600">{formatValue(objective.currentValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Falta</p>
            <p className="font-semibold text-sm text-muted-foreground">{falta > 0 ? formatValue(falta) : '-'}</p>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{objective.targetName || 'Sem atribuição'}</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", getProgressColor())}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
