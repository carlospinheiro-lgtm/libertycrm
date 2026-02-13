import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ObjectiveFlow, ObjectiveCategory, ActivityObjectiveType, ResultObjectiveType, ObjectiveUnit } from '@/types';

export interface DbObjective {
  id: string;
  agency_id: string;
  user_id: string;
  flow: ObjectiveFlow;
  objective_category: ObjectiveCategory;
  activity_type: ActivityObjectiveType | null;
  result_type: ResultObjectiveType | null;
  current_value: number;
  target_value: number;
  unit: ObjectiveUnit;
  unit_symbol: string;
  start_date: string;
  end_date: string;
  target_type: 'agency' | 'agent';
  target_id: string | null;
  target_name: string | null;
  source_filter: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useObjectives() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['objectives'];

  const { data: objectives = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DbObjective[];
    },
    enabled: !!user,
  });

  const addObjective = useMutation({
    mutationFn: async (objective: Omit<DbObjective, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('objectives')
        .insert({
          ...objective,
          user_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Objetivo criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar objetivo: ' + error.message);
    },
  });

  const updateObjective = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbObjective>) => {
      const { data, error } = await supabase
        .from('objectives')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Objetivo atualizado');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar objetivo: ' + error.message);
    },
  });

  const deleteObjective = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('objectives')
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Objetivo removido');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover objetivo: ' + error.message);
    },
  });

  return {
    objectives,
    isLoading,
    addObjective,
    updateObjective,
    deleteObjective,
  };
}
