import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbPropertyPortal {
  id: string;
  property_id: string;
  portal_name: string;
  is_published: boolean;
  portal_url: string | null;
  publish_date: string | null;
  last_updated: string | null;
}

export function usePropertyPortals(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-portals', propertyId];

  const { data: portals = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_portals')
        .select('*')
        .eq('property_id', propertyId);
      if (error) throw error;
      return data as DbPropertyPortal[];
    },
    enabled: !!user && !!propertyId,
  });

  const updatePortal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbPropertyPortal>) => {
      const { error } = await supabase.from('property_portals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { portals, isLoading, updatePortal };
}
