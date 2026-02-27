import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbLead {
  id: string;
  agency_id: string;
  user_id: string;
  client_name: string;
  email: string | null;
  phone: string | null;
  lead_type: 'buyer' | 'seller' | 'recruitment';
  source: string | null;
  source_category: string | null;
  entry_date: string;
  column_id: string;
  temperature: string;
  notes: string | null;
  next_activity_date: string | null;
  next_activity_description: string | null;
  cv_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  budget_min?: number | null;
  budget_max?: number | null;
  column_entered_at?: string;
  // Buyer-specific fields
  zones?: string[];
  typology?: string | null;
  last_contact_at?: string | null;
  next_action_text?: string | null;
  next_action_at?: string | null;
  buyer_motive?: string | null;
  buyer_timeline?: string | null;
  buyer_financing?: string | null;
  // joined profile data
  agent_name?: string;
  agency_name?: string;
}

export function useLeads(leadType: 'buyer' | 'seller' | 'recruitment') {
  const { user, currentUser } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['leads', leadType];

  const { data: leads = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, profiles!leads_user_id_profiles_fkey(name), agencies(name)')
        .eq('lead_type', leadType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((lead: any) => ({
        ...lead,
        agent_name: lead.profiles?.name || 'Desconhecido',
        agency_name: lead.agencies?.name || 'Desconhecida',
      }));
    },
    enabled: !!user,
  });

  const addLead = useMutation({
    mutationFn: async (lead: {
      client_name: string;
      email?: string;
      phone?: string;
      source?: string;
      source_category?: string;
      column_id: string;
      temperature?: string;
      notes?: string;
      agency_id: string;
    }) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          lead_type: leadType,
          user_id: user!.id,
          temperature: lead.temperature || 'warm',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Lead criada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar lead: ' + error.message);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbLead>) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar lead: ' + error.message);
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Lead removida');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover lead: ' + error.message);
    },
  });

  const moveLead = useMutation({
    mutationFn: async ({ id, column_id, next_activity_date, next_activity_description }: {
      id: string;
      column_id: string;
      next_activity_date?: string;
      next_activity_description?: string;
    }) => {
      const { error } = await supabase
        .from('leads')
        .update({
          column_id,
          next_activity_date,
          next_activity_description,
          column_entered_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error('Erro ao mover lead: ' + error.message);
    },
  });

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    moveLead,
  };
}
