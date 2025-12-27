import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Objective, ObjectiveFlow, objectiveFlowLabels } from '@/types';
import { cn } from '@/lib/utils';

interface MobileResultsSummaryProps {
  objectives: Objective[];
}

interface FlowStats {
  flow: ObjectiveFlow;
  definido: number;
  realizado: number;
  falta: number;
  taxa: number;
}

export function MobileResultsSummary({ objectives }: MobileResultsSummaryProps) {
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  // Calculate totals
  const totalDefinido = resultObjectives.length;
  const totalRealizado = resultObjectives.filter(o => o.currentValue >= o.targetValue).length;
  const totalFalta = totalDefinido - totalRealizado;
  const taxaConcretizacao = totalDefinido > 0 ? (totalRealizado / totalDefinido) * 100 : 0;
  
  // Calculate stats by flow
  const flows: ObjectiveFlow[] = ['vendedores', 'compradores', 'recrutamento', 'intermediacao_credito', 'geral'];
  
  const flowStats: FlowStats[] = flows.map(flow => {
    const flowObjectives = resultObjectives.filter(o => o.flow === flow);
    const definido = flowObjectives.length;
    const realizado = flowObjectives.filter(o => o.currentValue >= o.targetValue).length;
    const falta = definido - realizado;
    
    // Calculate percentage based on values, not counts
    const totalTarget = flowObjectives.reduce((sum, o) => sum + o.targetValue, 0);
    const totalCurrent = flowObjectives.reduce((sum, o) => sum + o.currentValue, 0);
    const taxa = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    
    return { flow, definido, realizado, falta, taxa };
  }).filter(s => s.definido > 0);
  
  const getStatusBadge = (taxa: number) => {
    if (taxa >= 90) return { label: 'No Alvo', color: 'bg-emerald-500/10 text-emerald-600' };
    if (taxa >= 70) return { label: 'Em Curso', color: 'bg-amber-500/10 text-amber-600' };
    return { label: 'Atenção', color: 'bg-red-500/10 text-red-600' };
  };
  
  const getProgressColor = (taxa: number) => {
    if (taxa >= 90) return 'bg-emerald-500';
    if (taxa >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getFlowIcon = (flow: ObjectiveFlow) => {
    switch (flow) {
      case 'vendedores': return '🏠';
      case 'compradores': return '🛒';
      case 'recrutamento': return '👥';
      case 'intermediacao_credito': return '💳';
      case 'geral': return '📊';
      default: return '📋';
    }
  };

  const summaryStats = [
    { label: 'Def.', value: totalDefinido, color: 'text-primary' },
    { label: 'Real.', value: totalRealizado, color: 'text-emerald-600' },
    { label: 'Falta', value: totalFalta, color: 'text-amber-600' },
    { label: 'Taxa', value: `${taxaConcretizacao.toFixed(0)}%`, color: taxaConcretizacao >= 70 ? 'text-emerald-600' : 'text-red-600' },
  ];

  if (resultObjectives.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum resultado definido</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Grid */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Resumo Resultados</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="bg-background/60 rounded-lg py-2 px-1">
                <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flow Cards */}
      <div className="space-y-3">
        {flowStats.map((stat) => {
          const status = getStatusBadge(stat.taxa);
          return (
            <Card key={stat.flow} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFlowIcon(stat.flow)}</span>
                    <span className="font-semibold text-sm">{objectiveFlowLabels[stat.flow]}</span>
                  </div>
                  <Badge className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stat.realizado}/{stat.definido} realizados
                    </span>
                    <span className={cn("font-bold", stat.taxa >= 70 ? 'text-emerald-600' : 'text-red-600')}>
                      {stat.taxa.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", getProgressColor(stat.taxa))}
                      style={{ width: `${Math.min(stat.taxa, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
