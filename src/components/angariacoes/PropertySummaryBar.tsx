import { Building2, Shield, ShieldAlert, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DbProperty } from '@/hooks/useProperties';
import { differenceInDays } from 'date-fns';

interface PropertySummaryBarProps {
  properties: DbProperty[];
}

export function PropertySummaryBar({ properties }: PropertySummaryBarProps) {
  const active = properties.filter(p => p.status === 'active');
  const exclusive = active.filter(p => p.contract_type === 'exclusive');
  const nonExclusive = active.filter(p => p.contract_type !== 'exclusive');

  const today = new Date();
  const expiringSoon = active.filter(p => {
    if (!p.contract_end_date) return false;
    const days = differenceInDays(new Date(p.contract_end_date), today);
    return days >= 0 && days <= 30;
  });
  const expired = active.filter(p => {
    if (!p.contract_end_date) return false;
    return differenceInDays(new Date(p.contract_end_date), today) < 0;
  });

  const stats = [
    { label: 'Total Ativas', value: active.length, icon: Building2, color: 'text-primary' },
    { label: 'Em Exclusividade', value: exclusive.length, icon: Shield, color: 'text-emerald-600' },
    { label: 'Não Exclusividade', value: nonExclusive.length, icon: ShieldAlert, color: 'text-muted-foreground' },
    { label: 'A expirar (30d)', value: expiringSoon.length, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Expiradas', value: expired.length, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map(s => (
        <Card key={s.label} className="p-3 flex items-center gap-3">
          <s.icon className={`h-5 w-5 ${s.color} flex-shrink-0`} />
          <div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
