import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ObjectivesSummary } from '@/components/dashboard/ObjectivesSummary';
import { ObjectivesTracking } from '@/components/dashboard/ObjectivesTracking';
import {
  Users,
  Home,
  FileText,
  UserPlus,
  TrendingUp,
  Calendar,
} from 'lucide-react';

const stats = [
  {
    title: 'Leads Compradores',
    value: 48,
    change: '+12% vs mês anterior',
    changeType: 'positive' as const,
    icon: Users,
    iconColor: 'primary' as const,
  },
  {
    title: 'Leads Vendedores',
    value: 32,
    change: '+8% vs mês anterior',
    changeType: 'positive' as const,
    icon: Home,
    iconColor: 'accent' as const,
  },
  {
    title: 'Processos Ativos',
    value: 15,
    change: '5 em escritura',
    changeType: 'neutral' as const,
    icon: FileText,
    iconColor: 'info' as const,
  },
  {
    title: 'Candidatos Recrutamento',
    value: 8,
    change: '3 em entrevista',
    changeType: 'neutral' as const,
    icon: UserPlus,
    iconColor: 'warning' as const,
  },
  {
    title: 'Faturação Mensal',
    value: '€45.2K',
    change: '+23% vs objetivo',
    changeType: 'positive' as const,
    icon: TrendingUp,
    iconColor: 'success' as const,
  },
  {
    title: 'Atividades Pendentes',
    value: 12,
    change: '4 para hoje',
    changeType: 'neutral' as const,
    icon: Calendar,
    iconColor: 'info' as const,
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
