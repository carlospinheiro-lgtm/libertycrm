import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  Project, 
  ProjectStatus, 
  CreateProjectInput, 
  UpdateProjectInput,
  ProjectStats 
} from '@/types/projects';

export function useProjects(agencyId?: string, statusFilter?: ProjectStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', agencyId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          pm_user:profiles!projects_pm_user_id_fkey(id, name, avatar_url),
          agency:agencies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          pm_user:profiles!projects_pm_user_id_fkey(id, name, avatar_url),
          agency:agencies(id, name)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!user && !!projectId,
  });
}

export function useProjectStats(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: async (): Promise<ProjectStats> => {
      if (!projectId) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          taskProgress: 0,
          plannedRevenue: 0,
          actualRevenue: 0,
          plannedCost: 0,
          actualCost: 0,
          plannedResult: 0,
          actualResult: 0,
          isOverBudget: false,
        };
      }

      // Buscar tarefas
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('status')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Buscar itens financeiros
      const { data: financials, error: financialsError } = await supabase
        .from('project_financial_items')
        .select('type, planned_value, actual_value')
        .eq('project_id', projectId)
        .neq('status', 'archived');

      if (financialsError) throw financialsError;

      let plannedRevenue = 0;
      let actualRevenue = 0;
      let plannedCost = 0;
      let actualCost = 0;

      financials?.forEach(item => {
        if (item.type === 'revenue') {
          plannedRevenue += Number(item.planned_value) || 0;
          actualRevenue += Number(item.actual_value) || 0;
        } else {
          plannedCost += Number(item.planned_value) || 0;
          actualCost += Number(item.actual_value) || 0;
        }
      });

      return {
        totalTasks,
        completedTasks,
        taskProgress,
        plannedRevenue,
        actualRevenue,
        plannedCost,
        actualCost,
        plannedResult: plannedRevenue - plannedCost,
        actualResult: actualRevenue - actualCost,
        isOverBudget: actualCost > plannedCost,
      };
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // Se não houver PM selecionado, usa o utilizador atual
      const finalPmId = input.pm_user_id || user?.id;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          pm_user_id: finalPmId,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar o PM como membro com role 'pm' apenas se tivermos um ID
      if (finalPmId) {
        await supabase
          .from('project_members')
          .insert({
            project_id: data.id,
            user_id: finalPmId,
            role: 'pm',
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectInput & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      toast.success('Projeto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar projeto: ${error.message}`);
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto arquivado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao arquivar projeto: ${error.message}`);
    },
  });
}
