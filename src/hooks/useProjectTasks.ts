import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  ProjectTask, 
  ProjectTaskStatus,
  CreateTaskInput, 
  UpdateTaskInput 
} from '@/types/projects';

export function useProjectTasks(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
          queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          assignee:profiles!project_tasks_assignee_user_id_fkey(id, name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      // Obter o próximo order_index
      const { data: existingTasks } = await supabase
        .from('project_tasks')
        .select('order_index')
        .eq('project_id', input.project_id)
        .eq('status', input.status || 'backlog')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...input,
          order_index: input.order_index ?? nextOrderIndex,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.project_id] });
      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...input }: UpdateTaskInput & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      projectId,
      newStatus, 
      newOrderIndex 
    }: { 
      taskId: string; 
      projectId: string;
      newStatus: ProjectTaskStatus; 
      newOrderIndex: number;
    }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .update({ 
          status: newStatus, 
          order_index: newOrderIndex 
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mover tarefa: ${error.message}`);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
      toast.success('Tarefa eliminada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar tarefa: ${error.message}`);
    },
  });
}
