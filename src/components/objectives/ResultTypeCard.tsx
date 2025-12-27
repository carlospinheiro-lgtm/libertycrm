import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ObjectiveFlow, objectiveFlowLabels } from '@/types';

export interface ResultTypeData {
  type: string;
  label: string;
  icon: string;
  definido: number;
  realizado: number;
  falta: number;
  taxa: number;
  isCurrency?: boolean;
  flows: ObjectiveFlow[];
  count: number;
}

interface ResultTypeCardProps {
  data: ResultTypeData;
  onClick?: () => void;
}

export function ResultTypeCard({ data, onClick }: ResultTypeCardProps) {
  const getStatusBadge = (taxa: number) => {
    if (taxa >= 90) return { label: 'No Alvo', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    if (taxa >= 70) return { label: 'Em Curso', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    return { label: 'Atenção', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
  };

  const getProgressColor = (taxa: number) => {
    if (taxa >= 90) return 'bg-emerald-500';
    if (taxa >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number, isCurrency?: boolean) => {
    if (isCurrency) {
      return new Intl.NumberFormat('pt-PT', { 
        style: 'currency', 
        currency: 'EUR',
        notation: value >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 0
      }).format(value);
    }
    return value.toString();
  };

  const status = getStatusBadge(data.taxa);

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{data.icon}</span>
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <Badge variant="outline" className={cn("text-xs", status.color)}>
            {status.label}
          </Badge>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-muted/50 rounded-lg py-2 px-1">
            <p className="text-sm md:text-base font-bold text-foreground">
              {formatValue(data.definido, data.isCurrency)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Definido</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg py-2 px-1">
            <p className="text-sm md:text-base font-bold text-emerald-600">
              {formatValue(data.realizado, data.isCurrency)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg py-2 px-1">
            <p className="text-sm md:text-base font-bold text-amber-600">
              {formatValue(data.falta, data.isCurrency)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Falta</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Concretização</span>
            <span className={cn("font-bold", data.taxa >= 70 ? 'text-emerald-600' : 'text-red-600')}>
              {data.taxa.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all", getProgressColor(data.taxa))}
              style={{ width: `${Math.min(data.taxa, 100)}%` }}
            />
          </div>
        </div>

        {/* Flows Tags */}
        {data.flows.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {data.flows.map(flow => (
              <span 
                key={flow}
                className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
              >
                {objectiveFlowLabels[flow]}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}