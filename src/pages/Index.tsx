import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ObjectivesSummary } from '@/components/dashboard/ObjectivesSummary';
import { ObjectivesTracking } from '@/components/dashboard/ObjectivesTracking';
import {
  Activity,
  Home,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

// Dados agregados dos objetivos (mock - futuramente virá da base de dados)
const dashboardStats = {
  // Vendedores Atividade
  vendedoresAtividade: {
    realized: 63,
    defined: 80,
    percentage: 79,
  },
  // Vendedores Resultado (Angariações Exclusivo + Exclusivo Rede)
  vendedoresResultado: {
    realized: 11,
    defined: 15,
    percentage: 73,
  },
  // Compradores Resultado (Reservas)
  compradoresResultado: {
    realized: 5,
    defined: 8,
    percentage: 63,
  },
  // Recrutamento Pipeline
  recrutamentoPipeline: {
    leadsObtidas: 22,
    entrevistasRealizadas: 12,
  },
  // Intermediação Crédito
  creditoPipeline: {
    emAnalise: 8,
    aprovados: 5,
  },
  // Faturação Mensal (derivada de comissões)
  faturacaoMensal: {
    valor: 45200,
    percentagemObjetivo: 83,
  },
};

const stats = [
  {
    title: 'Vendedores – Atividade',
    value: `${dashboardStats.vendedoresAtividade.percentage}%`,
    change: `${dashboardStats.vendedoresAtividade.realized}/${dashboardStats.vendedoresAtividade.defined} ações`,
    changeType: dashboardStats.vendedoresAtividade.percentage >= 70 ? 'positive' as const : 'neutral' as const,
    icon: Activity,
    iconColor: 'info' as const,
  },
  {
    title: 'Vendedores – Resultado',
    value: dashboardStats.vendedoresResultado.realized,
    change: `${dashboardStats.vendedoresResultado.percentage}% do objetivo`,
    changeType: dashboardStats.vendedoresResultado.percentage >= 70 ? 'positive' as const : 'neutral' as const,
    icon: Home,
    iconColor: 'success' as const,
  },
  {
    title: 'Compradores – Resultado',
    value: dashboardStats.compradoresResultado.realized,
    change: `${dashboardStats.compradoresResultado.percentage}% do objetivo`,
    changeType: dashboardStats.compradoresResultado.percentage >= 60 ? 'neutral' as const : 'negative' as const,
    icon: ShoppingCart,
    iconColor: 'success' as const,
  },
  {
    title: 'Recrutamento – Pipeline',
    value: dashboardStats.recrutamentoPipeline.leadsObtidas,
    change: `${dashboardStats.recrutamentoPipeline.entrevistasRealizadas} entrevistas`,
    changeType: 'neutral' as const,
    icon: Users,
    iconColor: 'purple' as const,
  },
  {
    title: 'Interm. Crédito – Pipeline',
    value: dashboardStats.creditoPipeline.emAnalise,
    change: `${dashboardStats.creditoPipeline.aprovados} aprovados`,
    changeType: 'neutral' as const,
    icon: CreditCard,
    iconColor: 'warning' as const,
  },
  {
    title: 'Faturação do Mês',
    value: `€${(dashboardStats.faturacaoMensal.valor / 1000).toFixed(1)}K`,
    change: `${dashboardStats.faturacaoMensal.percentagemObjetivo}% vs objetivo`,
    changeType: 'positive' as const,
    icon: TrendingUp,
    iconColor: 'success' as const,
  },
];

export default function Index() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho das agências Liberty
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>

        {/* Objectives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ObjectivesSummary />
          <ObjectivesTracking />
        </div>
      </div>
    </DashboardLayout>
  );
}
