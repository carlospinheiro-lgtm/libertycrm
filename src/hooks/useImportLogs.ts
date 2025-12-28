import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ImportLog = Tables<'import_logs'>;
export type ImportLogInsert = TablesInsert<'import_logs'>;

export function useImportLogs(agencyId: string | null) {
  return useQuery({
    queryKey: ['import_logs', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('imported_at', { ascending: false });
      
      if (error) throw error;
      return data as ImportLog[];
    },
  });
}

export function useCreateImportLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: ImportLogInsert) => {
      const { data, error } = await supabase
        .from('import_logs')
        .insert(log)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['import_logs', variables.agency_id] });
    },
  });
}
