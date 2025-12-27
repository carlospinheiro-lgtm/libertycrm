import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Activity, Award } from 'lucide-react';
import { Objective } from '@/types';

interface ObjectivesStatsProps {
  objectives: Objective[];
}

export function ObjectivesStats({ objectives }: ObjectivesStatsProps) {
  const total = objectives.length;
  const activityCount = objectives.filter(o => o.objectiveCategory === 'activity').length;
  const resultCount = objectives.filter(o => o.objectiveCategory === 'result').length;
  
  const onTarget = objectives.filter(o => {
    const percentage = (o.currentValue / o.targetValue) * 100;
    return percentage >= 90;
  }).length;
  
  const inProgress = objectives.filter(o => {
    const percentage = (o.currentValue / o.targetValue) * 100;
    return percentage >= 70 && percentage < 90;
  }).length;
  
  const atRisk = objectives.filter(o => {
    const percentage = (o.currentValue / o.targetValue) * 100;
    return percentage < 70;
  }).length;

  const stats = [
    {
      label: 'Total Objetivos',
      value: total,
      icon: Target,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Atividade',
      value: activityCount,
      subtitle: total > 0 ? `${Math.round((activityCount / total) * 100)}%` : '0%',
      icon: Activity,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'Resultado',
      value: resultCount,
      subtitle: total > 0 ? `${Math.round((resultCount / total) * 100)}%` : '0%',
      icon: Award,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'No Alvo',
      value: onTarget,
      subtitle: total > 0 ? `${Math.round((onTarget / total) * 100)}%` : '0%',
      icon: CheckCircle2,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Em Curso',
      value: inProgress,
      subtitle: total > 0 ? `${Math.round((inProgress / total) * 100)}%` : '0%',
      icon: TrendingUp,
      iconColor: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Atenção',
      value: atRisk,
      subtitle: total > 0 ? `${Math.round((atRisk / total) * 100)}%` : '0%',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.label}
                  {stat.subtitle && <span className="ml-1 font-medium">({stat.subtitle})</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}