import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Calculator } from 'lucide-react';
import { useProjectsAggregatedStats } from '@/hooks/useProjectsAggregatedStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectsStatsCardsProps {
  agencyId?: string;
}

export function ProjectsStatsCards({ agencyId }: ProjectsStatsCardsProps) {
  const { data: stats, isLoading } = useProjectsAggregatedStats(agencyId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Orçamento em Curso"
        value={formatCurrency(stats?.budgetInProgress || 0)}
        icon={Wallet}
        iconColor="primary"
        change={`${stats?.projectsInProgress || 0} projetos ativos`}
        changeType="neutral"
      />
      <StatCard
        title="Custos Fechados"
        value={formatCurrency(stats?.closedCosts || 0)}
        icon={ArrowDownCircle}
        iconColor="warning"
        change={`${stats?.projectsClosed || 0} projetos concluídos`}
        changeType="neutral"
      />
      <StatCard
        title="Receitas Fechadas"
        value={formatCurrency(stats?.closedRevenue || 0)}
        icon={ArrowUpCircle}
        iconColor="success"
      />
      <StatCard
        title="Resultado Fechados"
        value={formatCurrency(stats?.closedResult || 0)}
        icon={Calculator}
        iconColor={(stats?.closedResult || 0) >= 0 ? 'success' : 'warning'}
        changeType={(stats?.closedResult || 0) >= 0 ? 'positive' : 'negative'}
      />
    </div>
  );
}
