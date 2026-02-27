import { DbPropertyVisit } from '@/hooks/usePropertyVisits';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PropertyVisitsTabProps {
  visits: DbPropertyVisit[];
  onAddVisit: () => void;
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  high_interest: { label: 'Interesse Alto', color: 'bg-emerald-100 text-emerald-700' },
  medium_interest: { label: 'Interesse Médio', color: 'bg-amber-100 text-amber-700' },
  no_interest: { label: 'Sem Interesse', color: 'bg-muted text-muted-foreground' },
  offer_expected: { label: 'Proposta Esperada', color: 'bg-blue-100 text-blue-700' },
};

export function PropertyVisitsTab({ visits, onAddVisit }: PropertyVisitsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Visitas ({visits.length})</h3>
        <Button size="sm" onClick={onAddVisit}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Registar Visita
        </Button>
      </div>

      {visits.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          Nenhuma visita registada
        </Card>
      ) : (
        <div className="space-y-2">
          {visits.map(v => {
            const outcome = OUTCOME_LABELS[v.outcome] || OUTCOME_LABELS.medium_interest;
            return (
              <Card key={v.id} className="p-3 flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {format(new Date(v.visit_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                    <Badge className={`text-[10px] ${outcome.color}`}>{outcome.label}</Badge>
                  </div>
                  {v.buyer_name && <p className="text-xs">Comprador: {v.buyer_name}</p>}
                  {v.agent_name && <p className="text-xs text-muted-foreground">Agente: {v.agent_name}</p>}
                  {v.feedback && <p className="text-xs text-muted-foreground mt-1">{v.feedback}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
