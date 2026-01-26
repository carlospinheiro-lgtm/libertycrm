import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectsAggregatedStats {
  budgetInProgress: number;
  closedCosts: number;
  closedRevenue: number;
  closedResult: number;
  projectsInProgress: number;
  projectsClosed: number;
}

export function useProjectsAggregatedStats(agencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects-aggregated-stats', agencyId],
    queryFn: async (): Promise<ProjectsAggregatedStats> => {
      // Buscar todos os projetos
      let projectsQuery = supabase
        .from('projects')
        .select('id, status');

      if (agencyId) {
        projectsQuery = projectsQuery.eq('agency_id', agencyId);
      }

      const { data: projects, error: projectsError } = await projectsQuery;

      if (projectsError) throw projectsError;

      // Separar projetos ativos (planning, active, at_risk) e fechados (done)
      const activeProjectIds = projects
        ?.filter(p => ['planning', 'active', 'at_risk'].includes(p.status))
        .map(p => p.id) || [];
      
      const closedProjectIds = projects
        ?.filter(p => p.status === 'done')
        .map(p => p.id) || [];

      let budgetInProgress = 0;
      let closedCosts = 0;
      let closedRevenue = 0;

      // Buscar itens financeiros dos projetos ativos (orçamento planeado)
      if (activeProjectIds.length > 0) {
        const { data: activeFinancials, error: activeError } = await supabase
          .from('project_financial_items')
          .select('type, planned_value')
          .in('project_id', activeProjectIds)
          .neq('status', 'archived');

        if (activeError) throw activeError;

        activeFinancials?.forEach(item => {
          if (item.type === 'cost') {
            budgetInProgress += Number(item.planned_value) || 0;
          }
        });
      }

      // Buscar itens financeiros dos projetos fechados (valores reais)
      if (closedProjectIds.length > 0) {
        const { data: closedFinancials, error: closedError } = await supabase
          .from('project_financial_items')
          .select('type, actual_value')
          .in('project_id', closedProjectIds)
          .neq('status', 'archived');

        if (closedError) throw closedError;

        closedFinancials?.forEach(item => {
          if (item.type === 'cost') {
            closedCosts += Number(item.actual_value) || 0;
          } else if (item.type === 'revenue') {
            closedRevenue += Number(item.actual_value) || 0;
          }
        });
      }

      return {
        budgetInProgress,
        closedCosts,
        closedRevenue,
        closedResult: closedRevenue - closedCosts,
        projectsInProgress: activeProjectIds.length,
        projectsClosed: closedProjectIds.length,
      };
    },
    enabled: !!user,
  });
}
