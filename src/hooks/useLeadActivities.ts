import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LeadActivity {
  id: string;
  lead_id: string;
  agency_id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_name?: string;
}

export function useLeadActivities(leadId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async (): Promise<LeadActivity[]> => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*, profiles:user_id(name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        user_name: a.profiles?.name || 'Desconhecido',
      }));
    },
    enabled: !!leadId && !!user,
  });

  const addActivity = useMutation({
    mutationFn: async (activity: {
      lead_id: string;
      agency_id: string;
      activity_type: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const insertData = {
        lead_id: activity.lead_id,
        agency_id: activity.agency_id,
        activity_type: activity.activity_type,
        description: activity.description || null,
        metadata: (activity.metadata || {}) as any,
        user_id: user!.id,
      };
      const { data, error } = await supabase
        .from('lead_activities')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao registar atividade: ' + error.message);
    },
  });

  return { activities, isLoading, addActivity };
}
