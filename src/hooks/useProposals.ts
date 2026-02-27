import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Proposal {
  id: string;
  lead_id: string;
  agency_id: string;
  proposal_number: string;
  proposal_date: string;
  validity_date: string | null;
  deal_type: string;
  proposed_value: number;
  payment_method: string | null;
  mortgage_amount: number | null;
  bank: string | null;
  approval_status: string | null;
  down_payment: number | null;
  down_payment_date: string | null;
  deed_date: string | null;
  client_name: string | null;
  client_nif: string | null;
  client_address: string | null;
  client_email: string | null;
  client_phone: string | null;
  co_titular_name: string | null;
  co_titular_nif: string | null;
  property_address: string | null;
  property_typology: string | null;
  property_area: number | null;
  property_reference: string | null;
  condition_notes: string | null;
  inspection_required: boolean;
  inspection_deadline: string | null;
  special_conditions: string | null;
  conditions_checklist: any[];
  status: string;
  rejection_reason: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProposals(leadId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = leadId ? ['proposals', leadId] : ['proposals'];

  const { data: proposals = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (leadId) query = query.eq('lead_id', leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!user,
  });

  const generateProposalNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PROP-${year}-${random}`;
  };

  const addProposal = useMutation({
    mutationFn: async (proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('proposals')
        .insert(proposal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposta criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar proposta: ' + error.message);
    },
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Proposal>) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar proposta: ' + error.message);
    },
  });

  return {
    proposals,
    isLoading,
    addProposal,
    updateProposal,
    generateProposalNumber,
  };
}
