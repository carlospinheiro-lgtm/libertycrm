import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Consultant {
  id: string;
  name: string;
  nif: string | null;
  tier: string | null;
  commission_pct: number | null;
  commission_system: string | null;
  has_company: boolean | null;
  accumulated_12m: number | null;
  is_team_member: boolean | null;
  accumulated_12m_confirmed: boolean | null;
}

export function useConsultants() {
  return useQuery({
    queryKey: ['consultants-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, nif, tier, commission_pct, commission_system, has_company, accumulated_12m, is_team_member, accumulated_12m_confirmed')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as Consultant[];
    },
    staleTime: 5 * 60_000,
  });
}
