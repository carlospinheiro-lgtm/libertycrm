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
    queryFn: async (): Promise<T | null> => {
      if (!agencyId) return null;
      
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('setting_key', settingKey)
        .maybeSingle();
      
      if (error) throw error;
      return (data?.setting_value as T) ?? null;
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

// Contract Duration Settings
export interface ContractDurationSettings {
  defaultDays: number;
  options: number[];
}

const DEFAULT_CONTRACT_DURATION: ContractDurationSettings = {
  defaultDays: 120,
  options: [90, 120, 150, 180],
};

export function useContractDurationSettings(agencyId: string | undefined) {
  const query = useAgencySetting<ContractDurationSettings>(agencyId, 'contract_duration');
  return {
    ...query,
    data: query.data ?? DEFAULT_CONTRACT_DURATION,
  };
}

export function useUpdateContractDurationSettings() {
  return useUpsertAgencySetting();
}

// Commission Table Settings
export interface CommissionTier {
  from: number;
  to: number | null;
  fee1: string;
  fee2: string;
}

export interface CommissionTableSettings {
  tiers: CommissionTier[];
}

export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  { from: 0, to: 20000, fee1: '20%', fee2: '15%' },
  { from: 20001, to: 50000, fee1: '5000€', fee2: '4000€' },
  { from: 50001, to: 100000, fee1: '6000€', fee2: '5000€' },
  { from: 100001, to: 999999, fee1: '6%', fee2: '5%' },
  { from: 1000000, to: null, fee1: '5%', fee2: '4%' },
];

export function useCommissionTable(agencyId: string | undefined) {
  const query = useAgencySetting<CommissionTableSettings>(agencyId, 'commission_table');
  return {
    ...query,
    data: query.data ?? { tiers: DEFAULT_COMMISSION_TIERS },
  };
}

// Commission Split Settings
export interface CommissionSplitSettings {
  agentSplit: number;
  coMediacaoSplit: number;
}

const DEFAULT_COMMISSION_SPLIT: CommissionSplitSettings = {
  agentSplit: 50,
  coMediacaoSplit: 50,
};

export function useCommissionSplit(agencyId: string | undefined) {
  const query = useAgencySetting<CommissionSplitSettings>(agencyId, 'commission_split');
  return {
    ...query,
    data: query.data ?? DEFAULT_COMMISSION_SPLIT,
  };
}

// Commission Rental Settings
export interface CommissionRentalSettings {
  months: number;
}

const DEFAULT_COMMISSION_RENTAL: CommissionRentalSettings = {
  months: 1.5,
};

export function useCommissionRental(agencyId: string | undefined) {
  const query = useAgencySetting<CommissionRentalSettings>(agencyId, 'commission_rental');
  return {
    ...query,
    data: query.data ?? DEFAULT_COMMISSION_RENTAL,
  };
}

export function useUpdateCommissionSettings() {
  return useUpsertAgencySetting();
}
