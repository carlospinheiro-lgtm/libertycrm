import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgencyActiveUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetches active users for a given agency.
 * Filters by is_active in user_agencies and profiles.
 * Does not filter by role - allows all users with agency access.
 */
export function useAgencyActiveUsers(agencyId: string | undefined | null) {
  return useQuery({
    queryKey: ['agency-active-users', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];

      // Fetch user_agencies joined with profiles for active users
      const { data, error } = await supabase
        .from('user_agencies')
        .select(`
          user_id,
          profiles!user_agencies_user_id_fkey (
            id,
            name,
            email,
            is_active
          )
        `)
        .eq('agency_id', agencyId)
        .eq('is_active', true);

      if (error) throw error;
      if (!data) return [];

      // Filter and map to AgencyActiveUser format
      const users: AgencyActiveUser[] = data
        .filter((ua) => {
          const profile = ua.profiles as { id: string; name: string; email: string; is_active: boolean | null } | null;
          return profile && profile.is_active !== false;
        })
        .map((ua) => {
          const profile = ua.profiles as { id: string; name: string; email: string; is_active: boolean | null };
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return users;
    },
  });
}
