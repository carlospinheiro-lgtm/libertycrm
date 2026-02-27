import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbProperty {
  id: string;
  agency_id: string;
  lead_id: string | null;
  reference: string;
  created_by: string | null;
  assigned_agent: string | null;
  property_type: string;
  address: string | null;
  parish: string | null;
  city: string | null;
  area_m2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  garage: boolean | null;
  energy_certificate: string | null;
  asking_price: number;
  minimum_price: number | null;
  contract_type: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_duration_months: number | null;
  commission_percentage: number | null;
  current_stage: string;
  stage_entered_at: string | null;
  cover_photo_url: string | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined
  agent_name?: string;
  agent_avatar?: string | null;
  portals?: { portal_name: string; is_published: boolean }[];
}

export function useProperties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['properties'];

  const { data: properties = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, profiles!properties_assigned_agent_fkey(name, avatar_url), property_portals(portal_name, is_published)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        agent_name: p.profiles?.name || 'Sem agente',
        agent_avatar: p.profiles?.avatar_url || null,
        portals: p.property_portals || [],
      }));
    },
    enabled: !!user,
  });

  const updateProperty = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from('properties')
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
      toast.error('Erro ao atualizar angariação: ' + error.message);
    },
  });

  return { properties, isLoading, updateProperty };
}

export function useProperty(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('*, profiles!properties_assigned_agent_fkey(name, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        agent_name: (data as any).profiles?.name || 'Sem agente',
        agent_avatar: (data as any).profiles?.avatar_url || null,
      } as DbProperty;
    },
    enabled: !!user && !!id,
  });
}
