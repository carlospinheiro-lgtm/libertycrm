import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const activities = [
  {
    id: 1,
    user: 'Maria Silva',
    initials: 'MS',
    action: 'moveu lead para',
    target: 'Proposta Apresentada',
    time: 'Há 5 min',
    type: 'lead',
  },
  {
    id: 2,
    user: 'Pedro Costa',
    initials: 'PC',
    action: 'adicionou nova lead',
    target: 'João Ferreira',
    time: 'Há 15 min',
    type: 'new',
  },
  {
    id: 3,
    user: 'Ana Lopes',
    initials: 'AL',
    action: 'fechou processo',
    target: 'PROC-2024-089',
    time: 'Há 1h',
    type: 'success',
  },
  {
    id: 4,
    user: 'Ricardo Santos',
    initials: 'RS',
    action: 'agendou entrevista',
    target: 'Carlos Mendes',
    time: 'Há 2h',
    type: 'recruitment',
  },
  {
    id: 5,
    user: 'Sofia Almeida',
    initials: 'SA',
    action: 'atualizou angariação',
    target: 'Rua das Flores, 123',
    time: 'Há 3h',
    type: 'property',
  },
];

const badgeColors = {
  lead: 'bg-info/10 text-info border-info/20',
  new: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  recruitment: 'bg-warning/10 text-warning border-warning/20',
  property: 'bg-accent/10 text-accent border-accent/20',
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 animate-fade-in"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-muted">
                  {activity.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <Badge
                    variant="outline"
                    className={badgeColors[activity.type as keyof typeof badgeColors]}
                  >
                    {activity.target}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
