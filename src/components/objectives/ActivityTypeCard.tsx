import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ObjectiveFlow, objectiveFlowLabels } from '@/types';

export interface ActivityTypeData {
  type: string;
  label: string;
  icon: string;
  definido: number;
  realizado: number;
  falta: number;
  taxa: number;
  flows: ObjectiveFlow[];
  count: number;
}

interface ActivityTypeCardProps {
  data: ActivityTypeData;
  onClick?: () => void;
}

export function ActivityTypeCard({ data, onClick }: ActivityTypeCardProps) {
  const getStatusBadge = (taxa: number) => {
    if (taxa >= 90) return { label: 'No Alvo', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (taxa >= 70) return { label: 'Em Curso', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    return { label: 'Atenção', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
  };

  const getProgressColor = (taxa: number) => {
    if (taxa >= 90) return 'bg-blue-500';
    if (taxa >= 70) return 'bg-blue-400';
    return 'bg-red-500';
  };

  const status = getStatusBadge(data.taxa);

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md border-blue-500/20",
        onClick && "cursor-pointer hover:border-blue-500/40"
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

        {/* Label */}
        <div className="mb-3">
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
            Atividade
          </Badge>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-blue-500/10 rounded-lg py-2 px-1 border border-blue-500/20">
            <p className="text-sm md:text-base font-bold text-blue-600">
              {data.definido}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Definido</p>
          </div>
          <div className="bg-blue-600/10 rounded-lg py-2 px-1 border border-blue-600/20">
            <p className="text-sm md:text-base font-bold text-blue-700">
              {data.realizado}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg py-2 px-1 border border-amber-500/20">
            <p className="text-sm md:text-base font-bold text-amber-600">
              {data.falta}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Falta</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Execução</span>
            <span className={cn("font-bold", data.taxa >= 70 ? 'text-blue-600' : 'text-red-600')}>
              {data.taxa.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
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
                className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 rounded text-blue-600"
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
