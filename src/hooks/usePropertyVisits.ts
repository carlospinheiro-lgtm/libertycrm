import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbPropertyVisit {
  id: string;
  property_id: string;
  agency_id: string;
  visit_date: string;
  buyer_name: string | null;
  buyer_contact: string | null;
  agent_id: string | null;
  outcome: string;
  feedback: string | null;
  follow_up_created: boolean;
  created_at: string;
  agent_name?: string;
}

export function usePropertyVisits(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-visits', propertyId];

  const { data: visits = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_visits')
        .select('*, profiles!property_visits_agent_id_fkey(name)')
        .eq('property_id', propertyId)
        .order('visit_date', { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        agent_name: v.profiles?.name || '',
      }));
    },
    enabled: !!user && !!propertyId,
  });

  const addVisit = useMutation({
    mutationFn: async (visit: Omit<DbPropertyVisit, 'id' | 'created_at' | 'agent_name'>) => {
      const { error } = await supabase.from('property_visits').insert(visit);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Visita registada');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  return { visits, isLoading, addVisit };
}
