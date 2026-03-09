import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Consultant {
  id: string;
  name: string;
  nif: string | null;
  tier: string | null;
  commission_pct: number | null;
}

export function useConsultants() {
  return useQuery({
    queryKey: ['consultants-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name, nif, tier, commission_pct')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as Consultant[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
