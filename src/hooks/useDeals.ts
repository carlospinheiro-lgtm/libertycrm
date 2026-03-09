import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Deal {
  id: string;
  agency_id: string;
  pv_number: string | null;
  maxwork_id: string | null;
  deal_type: string | null;
  address: string | null;
  municipality: string | null;
  sale_value: number | null;
  commission_pct: number | null;
  commission_store: number | null;
  commission_remax: number | null;
  margin: number | null;
  partner_agency: string | null;
  side_fraction: number | null;
  consultant_name: string | null;
  consultant_commission: number | null;
  deal_status: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_value: number | null;
  invoice_total_vat: number | null;
  invoice_recipient: string | null;
  partner_invoice_number: string | null;
  cpcv_date: string | null;
  cpcv_pct: number | null;
  deed_date: string | null;
  deed_pct: number | null;
  conditional: string | null;
  signal_value: number | null;
  signal_returned: number | null;
  deed_days: number | null;
  docs_missing: string | null;
  received_date: string | null;
  consultant_paid_date: string | null;
  partner_paid_date: string | null;
  buyer_nif: string | null;
  buyer_name: string | null;
  archive_ref: string | null;
  notes: string | null;
  financing_value: number | null;
  financing_bank: string | null;
  financing_status: string | null;
  financing_commission: number | null;
  reported_month: string | null;
  received_month: string | null;
  process_manager: string | null;
  discount_pct: number | null;
  expense_discount: number | null;
  primary_margin: number | null;
  closed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useDeals() {
  const { currentUser } = useAuth();
  const agencyId = currentUser?.agencyId;

  return useQuery({
    queryKey: ['deals', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Deal[];
    },
    enabled: !!agencyId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const agencyId = currentUser?.agencyId;

  return useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      if (!agencyId) throw new Error('Sem agência');
      const { data, error } = await supabase
        .from('deals')
        .insert({ ...deal, agency_id: agencyId, deal_status: 0 } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deal> & { id: string }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useChangeStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      deal,
      newStatus,
      extraFields,
      note,
    }: {
      deal: Deal;
      newStatus: number;
      extraFields?: Record<string, any>;
      note?: string;
    }) => {
      // Update deal
      const { error: updateError } = await supabase
        .from('deals')
        .update({ deal_status: newStatus, ...(extraFields || {}) } as any)
        .eq('id', deal.id);
      if (updateError) throw updateError;

      // Insert history
      const { error: histError } = await supabase.from('deal_history').insert({
        deal_id: deal.id,
        agency_id: deal.agency_id,
        changed_by: user?.id || null,
        old_status: deal.deal_status ?? 0,
        new_status: newStatus,
        note: note || null,
      });
      if (histError) throw histError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
