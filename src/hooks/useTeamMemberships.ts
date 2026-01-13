import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type TeamMembership = Tables<'team_memberships'>;
export type TeamMembershipInsert = TablesInsert<'team_memberships'>;
export type TeamMembershipUpdate = TablesUpdate<'team_memberships'>;

export interface TeamMemberWithProfile extends TeamMembership {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeamMembershipsByTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['team-memberships', 'team', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          *,
          profile:profiles!team_memberships_user_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('is_leader', { ascending: false });
      
      if (error) throw error;
      return data as TeamMemberWithProfile[];
    },
  });
}

export function useTeamMembershipsByUser(userId: string | null) {
  return useQuery({
    queryKey: ['team-memberships', 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          *,
          team:teams (
            id,
            name,
            agency_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      userId,
      isLeader = false,
      relationType = 'member'
    }: { 
      teamId: string;
      userId: string;
      isLeader?: boolean;
      relationType?: string;
    }) => {
      // If setting as leader, first unset any existing leader
      if (isLeader) {
        await supabase
          .from('team_memberships')
          .update({ is_leader: false })
          .eq('team_id', teamId)
          .eq('is_leader', true);
      }
      
      const { data, error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: teamId,
          user_id: userId,
          is_leader: isLeader,
          relation_type: relationType,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'team', data.team_id] });
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'user', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_memberships')
        .update({ status: 'inactive' })
        .eq('team_id', teamId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { teamId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useSetTeamLeader() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      // First, unset any existing leader
      await supabase
        .from('team_memberships')
        .update({ is_leader: false })
        .eq('team_id', teamId)
        .eq('is_leader', true);
      
      // Then set the new leader
      const { data, error } = await supabase
        .from('team_memberships')
        .update({ is_leader: true, relation_type: 'leader' })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Also update the team's leader_user_id
      await supabase
        .from('teams')
        .update({ leader_user_id: userId })
        .eq('id', teamId);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'team', data.team_id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpsertTeamMembership() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      userId,
      data
    }: { 
      teamId: string;
      userId: string;
      data: Partial<TeamMembershipInsert>;
    }) => {
      // Check if membership exists
      const { data: existing } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from('team_memberships')
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
          .from('team_memberships')
          .insert({
            team_id: teamId,
            user_id: userId,
            is_leader: data.is_leader ?? false,
            relation_type: data.relation_type ?? 'member',
            status: 'active',
            is_synced: true,
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (error) throw error;
        return { action: 'created' as const, data: inserted };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'team', result.data.team_id] });
      queryClient.invalidateQueries({ queryKey: ['team-memberships', 'user', result.data.user_id] });
    },
  });
}

export function useTeamMembersCount(teamId: string | null) {
  return useQuery({
    queryKey: ['team-memberships', 'count', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return 0;
      
      const { count, error } = await supabase
        .from('team_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });
}

/**
 * Sync team memberships during import
 * - Creates new memberships for users in the list
 * - Updates existing memberships
 * - Deactivates memberships for users not in the list (if is_synced)
 */
export function useSyncTeamMemberships() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      agencyId,
      memberExternalIds,
      leaderExternalId
    }: { 
      teamId: string;
      agencyId: string;
      memberExternalIds: string[];
      leaderExternalId?: string;
    }) => {
      const result = {
        created: 0,
        updated: 0,
        deactivated: 0,
        errors: [] as string[],
      };
      
      // Get user_agencies for the agency to map external_ids to user_ids
      const { data: userAgencies, error: uaError } = await supabase
        .from('user_agencies')
        .select('user_id, external_id')
        .eq('agency_id', agencyId)
        .eq('is_active', true);
      
      if (uaError) throw uaError;
      
      const externalIdToUserId = new Map<string, string>();
      userAgencies?.forEach(ua => {
        if (ua.external_id && ua.user_id) {
          externalIdToUserId.set(ua.external_id, ua.user_id);
        }
      });
      
      const processedUserIds = new Set<string>();
      
      // Process each member
      for (const extId of memberExternalIds) {
        const userId = externalIdToUserId.get(extId);
        if (!userId) {
          result.errors.push(`Membro com external_id ${extId} não encontrado na agência`);
          continue;
        }
        
        processedUserIds.add(userId);
        const isLeader = extId === leaderExternalId;
        
        // Check if membership exists
        const { data: existing } = await supabase
          .from('team_memberships')
          .select('id, is_leader, status')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (existing) {
          // Update if needed
          const needsUpdate = 
            existing.status !== 'active' || 
            existing.is_leader !== isLeader;
          
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('team_memberships')
              .update({
                status: 'active',
                is_leader: isLeader,
                relation_type: isLeader ? 'leader' : 'member',
                is_synced: true,
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
            
            if (updateError) {
              result.errors.push(`Erro ao atualizar membro ${extId}: ${updateError.message}`);
            } else {
              result.updated++;
            }
          }
        } else {
          // Insert new membership
          const { error: insertError } = await supabase
            .from('team_memberships')
            .insert({
              team_id: teamId,
              user_id: userId,
              is_leader: isLeader,
              relation_type: isLeader ? 'leader' : 'member',
              status: 'active',
              is_synced: true,
              last_synced_at: new Date().toISOString(),
            });
          
          if (insertError) {
            result.errors.push(`Erro ao adicionar membro ${extId}: ${insertError.message}`);
          } else {
            result.created++;
          }
        }
      }
      
      // Deactivate synced memberships that are not in the list
      if (processedUserIds.size > 0) {
        const userIdArray = Array.from(processedUserIds);
        
        const { data: toDeactivate, error: fetchError } = await supabase
          .from('team_memberships')
          .select('id')
          .eq('team_id', teamId)
          .eq('is_synced', true)
          .eq('status', 'active')
          .not('user_id', 'in', `(${userIdArray.map(id => `"${id}"`).join(',')})`);
        
        if (!fetchError && toDeactivate && toDeactivate.length > 0) {
          const ids = toDeactivate.map(m => m.id);
          
          const { error: deactivateError } = await supabase
            .from('team_memberships')
            .update({ 
              status: 'inactive',
              last_synced_at: new Date().toISOString(),
            })
            .in('id', ids);
          
          if (!deactivateError) {
            result.deactivated = toDeactivate.length;
          }
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
