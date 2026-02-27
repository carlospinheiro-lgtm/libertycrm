import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbPropertyActivity {
  id: string;
  property_id: string;
  agency_id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

export function usePropertyActivities(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-activities', propertyId];

  const { data: activities = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_activities')
        .select('*, profiles!property_activities_user_id_fkey(name)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        user_name: a.profiles?.name || '',
      }));
    },
    enabled: !!user && !!propertyId,
  });

  const addActivity = useMutation({
    mutationFn: async (activity: Omit<DbPropertyActivity, 'id' | 'created_at' | 'user_name'>) => {
      const { error } = await supabase.from('property_activities').insert(activity);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { activities, isLoading, addActivity };
}
