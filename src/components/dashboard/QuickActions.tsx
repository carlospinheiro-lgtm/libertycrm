import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Home, FileText, Calendar } from 'lucide-react';

const actions = [
  { icon: UserPlus, label: 'Nova Lead Comprador', color: 'bg-primary hover:bg-primary/90' },
  { icon: Home, label: 'Nova Lead Vendedor', color: 'bg-accent hover:bg-accent/90' },
  { icon: Plus, label: 'Novo Candidato', color: 'bg-warning hover:bg-warning/90' },
  { icon: FileText, label: 'Novo Processo', color: 'bg-info hover:bg-info/90' },
  { icon: Calendar, label: 'Agendar Atividade', color: 'bg-success hover:bg-success/90' },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              className={`justify-start gap-3 text-white ${action.color}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
