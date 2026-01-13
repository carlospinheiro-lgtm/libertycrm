import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Team = Tables<'teams'>;
export type TeamInsert = TablesInsert<'teams'>;
export type TeamUpdate = TablesUpdate<'teams'>;

export function useTeamsByAgency(agencyId: string | null) {
  return useQuery({
    queryKey: ['teams', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('agency_id', agencyId)
        .order('name');
      
      if (error) throw error;
      return data as Team[];
    },
  });
}

export function useTeamByExternalId(agencyId: string | null, externalId: string | null) {
  return useQuery({
    queryKey: ['teams', agencyId, 'external', externalId],
    enabled: !!agencyId && !!externalId,
    queryFn: async () => {
      if (!agencyId || !externalId) return null;
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('external_id', externalId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Team | null;
    },
  });
}

export function useUpsertTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      externalId, 
      data 
    }: { 
      agencyId: string; 
      externalId: string; 
      data: Partial<TeamInsert>;
    }) => {
      // Check if team exists
      const { data: existing } = await supabase
        .from('teams')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('external_id', externalId)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from('teams')
          .update({
            ...data,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return { action: 'updated' as const, data: updated };
      } else {
        // Insert
        const { data: inserted, error } = await supabase
          .from('teams')
          .insert({
            agency_id: agencyId,
            external_id: externalId,
            name: data.name || '',
            nickname: data.nickname,
            team_type: data.team_type,
            leader_user_id: data.leader_user_id,
            is_active: data.is_active ?? true,
            is_synced: true,
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        return { action: 'created' as const, data: inserted };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.agencyId] });
    },
  });
}

export function useDeactivateMissingTeams() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      activeExternalIds 
    }: { 
      agencyId: string; 
      activeExternalIds: string[];
    }) => {
      // Find teams that are synced but not in the active list
      const { data: teamsToDeactivate, error: fetchError } = await supabase
        .from('teams')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('is_synced', true)
        .eq('is_active', true)
        .not('external_id', 'in', `(${activeExternalIds.map(id => `"${id}"`).join(',')})`);
      
      if (fetchError) throw fetchError;
      
      if (!teamsToDeactivate || teamsToDeactivate.length === 0) {
        return 0;
      }
      
      const ids = teamsToDeactivate.map(t => t.id);
      
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          is_active: false,
          last_synced_at: new Date().toISOString(),
        })
        .in('id', ids);
      
      if (updateError) throw updateError;
      
      return teamsToDeactivate.length;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams', variables.agencyId] });
    },
  });
}
