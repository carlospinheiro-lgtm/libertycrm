import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Objective } from '@/types';

interface ObjectiveCategoryCardsProps {
  objectives: Objective[];
  onCategoryClick?: (category: 'activity' | 'result') => void;
  selectedCategory?: 'activity' | 'result' | null;
}

export function ObjectiveCategoryCards({ 
  objectives, 
  onCategoryClick,
  selectedCategory 
}: ObjectiveCategoryCardsProps) {
  const activityObjectives = objectives.filter(o => o.objectiveCategory === 'activity');
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');

  const calcStats = (objs: Objective[]) => {
    const total = objs.length;
    const definido = objs.reduce((sum, o) => sum + o.targetValue, 0);
    const realizado = objs.reduce((sum, o) => sum + o.currentValue, 0);
    const taxa = definido > 0 ? (realizado / definido) * 100 : 0;
    const noAlvo = objs.filter(o => (o.currentValue / o.targetValue) >= 0.9).length;
    return { total, definido, realizado, taxa, noAlvo };
  };

  const activityStats = calcStats(activityObjectives);
  const resultStats = calcStats(resultObjectives);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Activity Card */}
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md overflow-hidden",
          "border-l-4 border-l-primary",
          selectedCategory === 'activity' && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => onCategoryClick?.('activity')}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Objetivos de Atividade</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Esforço e execução diária
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {activityStats.total} objetivos
            </Badge>
          </div>

          {/* Examples */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1.5">Inclui:</p>
            <div className="flex flex-wrap gap-1">
              {['Prospeção', 'Leads', 'Contactos', 'Visitas', 'Chamadas'].map(ex => (
                <span 
                  key={ex}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-sm font-bold">{activityStats.definido}</p>
              <p className="text-[10px] text-muted-foreground">Definido</p>
            </div>
            <div className="bg-primary/10 rounded-lg py-2">
              <p className="text-sm font-bold text-primary">{activityStats.realizado}</p>
              <p className="text-[10px] text-muted-foreground">Realizado</p>
            </div>
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-sm font-bold">{activityStats.noAlvo}</p>
              <p className="text-[10px] text-muted-foreground">No Alvo</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Concretização</span>
              <span className={cn("font-bold", activityStats.taxa >= 70 ? 'text-primary' : 'text-amber-600')}>
                {activityStats.taxa.toFixed(0)}%
              </span>
            </div>
            <Progress value={activityStats.taxa} className="h-2" />
          </div>

          {/* CTA */}
          <div className="flex items-center justify-end mt-3 text-xs text-primary">
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md overflow-hidden",
          "border-l-4 border-l-emerald-500",
          selectedCategory === 'result' && "ring-2 ring-emerald-500 ring-offset-2"
        )}
        onClick={() => onCategoryClick?.('result')}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Trophy className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Objetivos de Resultado</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Concretização e fecho
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
              {resultStats.total} objetivos
            </Badge>
          </div>

          {/* Examples */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1.5">Inclui:</p>
            <div className="flex flex-wrap gap-1">
              {['Reservas', 'Angariações', 'Transações', 'Faturação', 'Créditos'].map(ex => (
                <span 
                  key={ex}
                  className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-sm font-bold">{resultStats.definido}</p>
              <p className="text-[10px] text-muted-foreground">Definido</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg py-2">
              <p className="text-sm font-bold text-emerald-600">{resultStats.realizado}</p>
              <p className="text-[10px] text-muted-foreground">Realizado</p>
            </div>
            <div className="bg-muted/50 rounded-lg py-2">
              <p className="text-sm font-bold">{resultStats.noAlvo}</p>
              <p className="text-[10px] text-muted-foreground">No Alvo</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Concretização</span>
              <span className={cn("font-bold", resultStats.taxa >= 70 ? 'text-emerald-600' : 'text-amber-600')}>
                {resultStats.taxa.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(resultStats.taxa, 100)}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-end mt-3 text-xs text-emerald-600">
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
