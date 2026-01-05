import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  agency_id: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
}

export interface UserAgencyInfo {
  id: string;
  user_id: string;
  agency_id: string;
  team_id: string | null;
  is_active: boolean | null;
}

export function useUserRoles(userId: string | null) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role, agency_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!userId,
  });
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, phone, avatar_url, is_active')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });
}

export function useUserAgencies(userId: string | null) {
  return useQuery({
    queryKey: ['user-agencies-auth', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_agencies')
        .select('id, user_id, agency_id, team_id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as UserAgencyInfo[];
    },
    enabled: !!userId,
  });
}
