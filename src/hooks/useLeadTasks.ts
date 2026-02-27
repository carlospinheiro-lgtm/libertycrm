import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LeadTask {
  id: string;
  lead_id: string;
  agency_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  assignee_name?: string;
}

export function useLeadTasks(leadId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['lead-tasks', leadId],
    queryFn: async (): Promise<LeadTask[]> => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('lead_tasks')
        .select('*, profiles:assigned_to(name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        assignee_name: t.profiles?.name || null,
      }));
    },
    enabled: !!leadId && !!user,
  });

  const addTask = useMutation({
    mutationFn: async (task: {
      lead_id: string;
      agency_id: string;
      title: string;
      description?: string;
      due_date?: string;
      assigned_to?: string;
    }) => {
      const { data, error } = await supabase
        .from('lead_tasks')
        .insert({ ...task, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] });
      toast.success('Tarefa criada');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; completed_at?: string | null }) => {
      const { error } = await supabase
        .from('lead_tasks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lead_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-tasks', leadId] });
      toast.success('Tarefa removida');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover tarefa: ' + error.message);
    },
  });

  return { tasks, isLoading, addTask, updateTask, deleteTask };
}
