import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type LeadMovePopupMode = 'always' | 'critical' | 'never';

export interface LeadSettingsValue {
  popupMode: LeadMovePopupMode;
  criticalColumns?: string[];
}

export function useAgencySetting<T = unknown>(agencyId: string | undefined, settingKey: string) {
  return useQuery({
    queryKey: ['agency-settings', agencyId, settingKey],
    queryFn: async () => {
      if (!agencyId) return null;
      
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('setting_key', settingKey)
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value as T | null;
    },
    enabled: !!agencyId,
  });
}

export function useUpsertAgencySetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      agencyId, 
      settingKey, 
      settingValue 
    }: { 
      agencyId: string; 
      settingKey: string; 
      settingValue: unknown;
    }) => {
      // First try to get existing setting
      const { data: existing } = await supabase
        .from('agency_settings')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('setting_key', settingKey)
        .maybeSingle();
      
      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('agency_settings')
          .update({
            setting_value: settingValue as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('agency_settings')
          .insert({
            agency_id: agencyId,
            setting_key: settingKey,
            setting_value: settingValue as Json,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['agency-settings', variables.agencyId, variables.settingKey] 
      });
    },
  });
}

export function useLeadSettings(agencyId: string | undefined) {
  return useAgencySetting<LeadSettingsValue>(agencyId, 'lead_move_popup');
}

export function useUpdateLeadSettings() {
  return useUpsertAgencySetting();
}
