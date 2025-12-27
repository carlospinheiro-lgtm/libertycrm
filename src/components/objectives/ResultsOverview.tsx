import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Objective, ObjectiveFlow, objectiveFlowLabels } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsOverviewProps {
  objectives: Objective[];
}

interface FlowStats {
  flow: ObjectiveFlow;
  definido: number;
  realizado: number;
  falta: number;
  taxa: number;
}

export function ResultsOverview({ objectives }: ResultsOverviewProps) {
  // Filter only result objectives
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  // Calculate totals
  const totalDefinido = resultObjectives.reduce((sum, o) => sum + o.targetValue, 0);
  const totalRealizado = resultObjectives.reduce((sum, o) => sum + o.currentValue, 0);
  const totalFalta = Math.max(0, totalDefinido - totalRealizado);
  const taxaConcretizacao = totalDefinido > 0 ? (totalRealizado / totalDefinido) * 100 : 0;
  
  // Calculate stats by flow
  const flows: ObjectiveFlow[] = ['vendedores', 'compradores', 'recrutamento', 'intermediacao_credito', 'geral'];
  
  const flowStats: FlowStats[] = flows.map(flow => {
    const flowObjectives = resultObjectives.filter(o => o.flow === flow);
    const definido = flowObjectives.reduce((sum, o) => sum + o.targetValue, 0);
    const realizado = flowObjectives.reduce((sum, o) => sum + o.currentValue, 0);
    const falta = Math.max(0, definido - realizado);
    const taxa = definido > 0 ? (realizado / definido) * 100 : 0;
    return { flow, definido, realizado, falta, taxa };
  }).filter(s => s.definido > 0); // Only show flows with objectives
  
  const getStatusColor = (taxa: number) => {
    if (taxa >= 90) return 'text-emerald-600';
    if (taxa >= 70) return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getStatusBg = (taxa: number) => {
    if (taxa >= 90) return 'bg-emerald-500';
    if (taxa >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getStatusIcon = (taxa: number) => {
    if (taxa >= 90) return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (taxa >= 70) return <Target className="h-4 w-4 text-amber-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const summaryCards = [
    {
      label: 'Definidos',
      value: resultObjectives.length,
      subtitle: 'objetivos',
      icon: Target,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Realizados',
      value: resultObjectives.filter(o => o.currentValue >= o.targetValue).length,
      subtitle: 'concluídos',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Em Falta',
      value: resultObjectives.filter(o => o.currentValue < o.targetValue).length,
      subtitle: 'por atingir',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Taxa',
      value: `${taxaConcretizacao.toFixed(1)}%`,
      subtitle: 'concretização',
      icon: Trophy,
      iconColor: getStatusColor(taxaConcretizacao),
      bgColor: taxaConcretizacao >= 90 ? 'bg-emerald-500/10' : taxaConcretizacao >= 70 ? 'bg-amber-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Resultados - Visão Geral
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", card.bgColor)}>
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress by Flow */}
        {flowStats.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Por Fluxo</h4>
            <div className="space-y-3">
              {flowStats.map((stat) => (
                <div key={stat.flow} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{objectiveFlowLabels[stat.flow]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {stat.realizado}/{stat.definido}
                      </span>
                      <span className={cn("font-semibold", getStatusColor(stat.taxa))}>
                        {stat.taxa.toFixed(0)}%
                      </span>
                      {getStatusIcon(stat.taxa)}
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(stat.taxa, 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {resultObjectives.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum objetivo de resultado definido</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}