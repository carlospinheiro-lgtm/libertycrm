import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RecruitmentInteraction {
  id: string;
  lead_id: string;
  agency_id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'stage_change' | 'other';
  note: string | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string;
}

export function useRecruitmentInteractions(leadId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['recruitment_interactions', leadId];

  const { data: interactions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('recruitment_interactions')
        .select('*, profiles:created_by(name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((i: any) => ({
        ...i,
        creator_name: i.profiles?.name || 'Desconhecido',
      }));
    },
    enabled: !!leadId && !!user,
  });

  const addInteraction = useMutation({
    mutationFn: async (params: {
      lead_id: string;
      agency_id: string;
      type: string;
      note?: string;
    }) => {
      const { error } = await supabase.from('recruitment_interactions').insert({
        lead_id: params.lead_id,
        agency_id: params.agency_id,
        type: params.type,
        note: params.note || null,
        created_by: user!.id,
      });
      if (error) throw error;

      await supabase
        .from('leads')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', params.lead_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['leads', 'recruitment'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao registar interação: ' + error.message);
    },
  });

  return { interactions, isLoading, addInteraction };
}
