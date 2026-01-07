import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type UserAgency = Tables<'user_agencies'>;
export type UserRole = Tables<'user_roles'>;
export type Team = Tables<'teams'>;
export type AppRole = Enums<'app_role'>;

export type ProfileInsert = TablesInsert<'profiles'>;
export type UserAgencyInsert = TablesInsert<'user_agencies'>;
export type UserRoleInsert = TablesInsert<'user_roles'>;

export interface UserWithAgencyInfo {
  profile: Profile;
  userAgency: UserAgency;
  roles: UserRole[];
}

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agencyId: string;
  teamId: string | null;
  teamName: string | null;
  isActive: boolean;
  isSynced: boolean;
  externalId: string | null;
  roles: AppRole[];
}

export function useUsersWithDetails(agencyId: string | null) {
  return useQuery({
    queryKey: ['users_with_details', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];

      // Fetch user_agencies with profiles and teams
      const { data: userAgencies, error: uaError } = await supabase
        .from('user_agencies')
        .select(`
          *,
          profiles!user_agencies_user_id_fkey (*),
          teams!user_agencies_team_id_fkey (*)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (uaError) throw uaError;
      if (!userAgencies) return [];

      // Fetch roles for all users in this agency
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('agency_id', agencyId);

      if (rolesError) throw rolesError;

      // Combine data
      return userAgencies.map((ua): UserWithDetails => {
        const profile = ua.profiles as Profile;
        const team = ua.teams as Team | null;
        const userRoles = roles?.filter(r => r.user_id === ua.user_id).map(r => r.role) || [];

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          agencyId: ua.agency_id,
          teamId: ua.team_id,
          teamName: team?.name || null,
          isActive: ua.is_active ?? true,
          isSynced: ua.is_synced ?? false,
          externalId: ua.external_id,
          roles: userRoles,
        };
      });
    },
  });
}

export function useUserAgenciesByAgency(agencyId: string | null) {
  return useQuery({
    queryKey: ['user_agencies', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('user_agencies')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useProfileByEmail(email: string | null) {
  return useQuery({
    queryKey: ['profiles', 'email', email],
    enabled: !!email,
    queryFn: async () => {
      if (!email) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUserAgencyByExternalId(agencyId: string | null, externalId: string | null) {
  return useQuery({
    queryKey: ['user_agencies', agencyId, 'external', externalId],
    enabled: !!agencyId && !!externalId,
    queryFn: async () => {
      if (!agencyId || !externalId) return null;
      
      const { data, error } = await supabase
        .from('user_agencies')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('agency_id', agencyId)
        .eq('external_id', externalId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertUserAgency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      externalId,
      profileId,
      teamId,
      data 
    }: { 
      agencyId: string; 
      externalId: string;
      profileId: string;
      teamId?: string | null;
      data: Partial<UserAgencyInsert>;
    }) => {
      // Check if user_agency exists by external_id
      const { data: existing } = await supabase
        .from('user_agencies')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('external_id', externalId)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from('user_agencies')
          .update({
            ...data,
            team_id: teamId,
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
          .from('user_agencies')
          .insert({
            agency_id: agencyId,
            user_id: profileId,
            external_id: externalId,
            team_id: teamId,
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
      queryClient.invalidateQueries({ queryKey: ['user_agencies', variables.agencyId] });
    },
  });
}

export function useUpsertUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      agencyId, 
      role 
    }: { 
      userId: string; 
      agencyId: string;
      role: string;
    }) => {
      // Check if role exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .eq('role', role as any)
        .maybeSingle();
      
      if (existing) {
        return { action: 'exists' as const, data: existing };
      }
      
      // Insert new role
      const { data: inserted, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          agency_id: agencyId,
          role: role as any,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { action: 'created' as const, data: inserted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}

export function useDeactivateMissingUsers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      activeExternalIds 
    }: { 
      agencyId: string; 
      activeExternalIds: string[];
    }) => {
      // Find user_agencies that are synced but not in the active list
      const { data: toDeactivate, error: fetchError } = await supabase
        .from('user_agencies')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('is_synced', true)
        .eq('is_active', true)
        .not('external_id', 'in', `(${activeExternalIds.map(id => `"${id}"`).join(',')})`);
      
      if (fetchError) throw fetchError;
      
      if (!toDeactivate || toDeactivate.length === 0) {
        return 0;
      }
      
      const ids = toDeactivate.map(t => t.id);
      
      const { error: updateError } = await supabase
        .from('user_agencies')
        .update({ 
          is_active: false,
          last_synced_at: new Date().toISOString(),
        })
        .in('id', ids);
      
      if (updateError) throw updateError;
      
      return toDeactivate.length;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user_agencies', variables.agencyId] });
    },
  });
}
