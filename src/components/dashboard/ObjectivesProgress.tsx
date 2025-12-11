import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const objectives = [
  { label: 'Transações Mensais', current: 12, target: 15, percentage: 80 },
  { label: 'Novas Angariações', current: 8, target: 10, percentage: 80 },
  { label: 'Leads Qualificadas', current: 45, target: 50, percentage: 90 },
  { label: 'Recrutamentos Q4', current: 3, target: 5, percentage: 60 },
];

function getProgressColor(percentage: number) {
  if (percentage >= 90) return 'bg-success';
  if (percentage >= 70) return 'bg-warning';
  return 'bg-destructive';
}

export function ObjectivesProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Objetivos do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {objectives.map((obj) => (
            <div key={obj.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{obj.label}</span>
                <span className="text-muted-foreground">
                  {obj.current}/{obj.target}
                </span>
              </div>
              <div className="relative">
                <Progress value={obj.percentage} className="h-2" />
                <div
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(obj.percentage)}`}
                  style={{ width: `${obj.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {obj.percentage}% concluído
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
