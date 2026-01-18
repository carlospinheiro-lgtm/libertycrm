import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  ProjectFinancialItem, 
  FinancialItemType,
  FinancialItemStatus,
  CreateFinancialItemInput, 
  UpdateFinancialItemInput 
} from '@/types/projects';

export function useProjectFinancials(projectId?: string, type?: FinancialItemType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-financials-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_financial_items',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-financials', projectId] });
          queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return useQuery({
    queryKey: ['project-financials', projectId, type],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from('project_financial_items')
        .select(`
          *,
          responsible_user:profiles!project_financial_items_responsible_user_id_fkey(id, name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProjectFinancialItem[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateFinancialItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateFinancialItemInput) => {
      const { data, error } = await supabase
        .from('project_financial_items')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-financials', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.project_id] });
      toast.success(data.type === 'revenue' ? 'Receita criada com sucesso!' : 'Custo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar item financeiro: ${error.message}`);
    },
  });
}

export function useUpdateFinancialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...input }: UpdateFinancialItemInput & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('project_financial_items')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-financials', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
      toast.success('Item financeiro atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item financeiro: ${error.message}`);
    },
  });
}

export function useUpdateFinancialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      projectId, 
      status,
      date_real
    }: { 
      id: string; 
      projectId: string;
      status: FinancialItemStatus;
      date_real?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      // Se marcar como pago/recebido e não tiver data real, usar data atual
      if ((status === 'paid' || status === 'received') && date_real) {
        updateData.date_real = date_real;
      }

      const { data, error } = await supabase
        .from('project_financial_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-financials', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
      
      const statusMessages: Record<FinancialItemStatus, string> = {
        planned: 'Marcado como planeado',
        submitted: 'Submetido para aprovação',
        approved: 'Aprovado com sucesso',
        paid: 'Marcado como pago',
        received: 'Marcado como recebido',
        archived: 'Arquivado com sucesso',
      };
      
      toast.success(statusMessages[data.status as FinancialItemStatus] || 'Status atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

export function useDeleteFinancialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_financial_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-financials', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', data.projectId] });
      toast.success('Item financeiro eliminado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar item financeiro: ${error.message}`);
    },
  });
}
