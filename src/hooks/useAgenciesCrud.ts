import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Agency = Tables<'agencies'>;
export type AgencyInsert = TablesInsert<'agencies'>;
export type AgencyUpdate = TablesUpdate<'agencies'>;

export interface AgencyWithStats extends Agency {
  userCount: number;
  teamCount: number;
}

export function useAgenciesWithStats() {
  return useQuery({
    queryKey: ['agencies', 'with-stats'],
    queryFn: async () => {
      // Fetch agencies
      const { data: agencies, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
      
      if (agencyError) throw agencyError;
      
      // Fetch user counts per agency
      const { data: userCounts, error: userError } = await supabase
        .from('user_agencies')
        .select('agency_id')
        .eq('is_active', true);
      
      if (userError) throw userError;
      
      // Fetch team counts per agency
      const { data: teamCounts, error: teamError } = await supabase
        .from('teams')
        .select('agency_id')
        .eq('is_active', true);
      
      if (teamError) throw teamError;
      
      // Count per agency
      const userCountMap = new Map<string, number>();
      userCounts?.forEach(ua => {
        const count = userCountMap.get(ua.agency_id) || 0;
        userCountMap.set(ua.agency_id, count + 1);
      });
      
      const teamCountMap = new Map<string, number>();
      teamCounts?.forEach(t => {
        const count = teamCountMap.get(t.agency_id) || 0;
        teamCountMap.set(t.agency_id, count + 1);
      });
      
      // Combine data
      return agencies.map(agency => ({
        ...agency,
        userCount: userCountMap.get(agency.id) || 0,
        teamCount: teamCountMap.get(agency.id) || 0,
      })) as AgencyWithStats[];
    },
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agency: AgencyInsert) => {
      const { data, error } = await supabase
        .from('agencies')
        .insert(agency)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: AgencyUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('agencies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
    },
  });
}

export function useToggleAgencyActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('agencies')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
    },
  });
}

export function useDeleteAgency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
    },
  });
}
