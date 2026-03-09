import { useQuery } from '@tanstack/react-query';
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
