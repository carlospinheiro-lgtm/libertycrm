import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Agency = Tables<'agencies'>;

export function useAgencies() {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Agency[];
    },
  });
}

export function useActiveAgencies() {
  return useQuery({
    queryKey: ['agencies', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Agency[];
    },
  });
}

export function useAgency(id: string | null) {
  return useQuery({
    queryKey: ['agencies', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Agency | null;
    },
  });
}
