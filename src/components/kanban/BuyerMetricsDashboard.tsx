import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Target, Eye, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { differenceInDays, startOfWeek, startOfMonth } from 'date-fns';

interface MetricLead {
  id: string;
  clientName: string;
  columnId: string;
  createdAt: string;
  lastContactAt?: string | null;
  columnEnteredAt?: string;
  agentName?: string;
}

interface BuyerMetricsDashboardProps {
  leads: MetricLead[];
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BuyerMetricsDashboard({ leads }: BuyerMetricsDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const thisWeek = (dateStr: string) => new Date(dateStr) >= weekStart;
    const thisMonth = (dateStr: string) => new Date(dateStr) >= monthStart;

    const novas = leads.filter(l => l.columnId === 'novo' && thisWeek(l.createdAt)).length;
    const contactadas = leads.filter(l => l.columnId === 'contacto-feito' && thisWeek(l.columnEnteredAt || l.createdAt)).length;
    const qualificadas = leads.filter(l => l.columnId === 'qualificacao' && thisWeek(l.columnEnteredAt || l.createdAt)).length;
    const visitas = leads.filter(l => l.columnId === 'visitas' && thisWeek(l.columnEnteredAt || l.createdAt)).length;
    const propostas = leads.filter(l => l.columnId === 'proposta-negociacao' && thisMonth(l.columnEnteredAt || l.createdAt)).length;
    const reservas = leads.filter(l => l.columnId === 'reserva-cpcv' && thisMonth(l.columnEnteredAt || l.createdAt)).length;

    const stale = leads.filter(l => {
      if (!l.lastContactAt) return true;
      return differenceInDays(now, new Date(l.lastContactAt)) > 7;
    }).filter(l => !['reserva-cpcv', 'perdido-followup'].includes(l.columnId));

    return { novas, contactadas, qualificadas, visitas, propostas, reservas, stale };
  }, [leads]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        <MetricCard icon={Users} label="Novas (sem.)" value={metrics.novas} color="bg-primary/10 text-primary" />
        <MetricCard icon={Phone} label="Contactadas (sem.)" value={metrics.contactadas} color="bg-info/10 text-info" />
        <MetricCard icon={Target} label="Qualificadas (sem.)" value={metrics.qualificadas} color="bg-info/10 text-info" />
        <MetricCard icon={Eye} label="Visitas (sem.)" value={metrics.visitas} color="bg-warning/10 text-warning" />
        <MetricCard icon={FileText} label="Propostas (mês)" value={metrics.propostas} color="bg-warning/10 text-warning" />
        <MetricCard icon={CheckCircle} label="Reservas (mês)" value={metrics.reservas} color="bg-success/10 text-success" />
        <MetricCard icon={AlertTriangle} label=">7d sem contacto" value={metrics.stale.length} color="bg-destructive/10 text-destructive" />
      </div>
    </div>
  );
}
