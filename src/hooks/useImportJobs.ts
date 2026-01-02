import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ImportJob {
  id: string;
  agency_id: string;
  type: 'users' | 'teams';
  file_name: string;
  file_hash?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by_user_id?: string | null;
  created_at: string;
  completed_at?: string | null;
  summary_json?: {
    created: number;
    updated: number;
    deactivated: number;
    unchanged: number;
    errors: string[];
  } | null;
  diff_json?: Array<{
    external_id: string;
    changes: Array<{
      field: string;
      fieldLabel: string;
      currentValue: string | null;
      newValue: string;
    }>;
    appliedAt: string;
  }> | null;
  notes?: string | null;
}

export interface ImportJobInsert {
  agency_id: string;
  type: 'users' | 'teams';
  file_name: string;
  file_hash?: string | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  created_by_user_id?: string | null;
  summary_json?: ImportJob['summary_json'];
  diff_json?: ImportJob['diff_json'];
  notes?: string | null;
}

export function useImportJobs(agencyId: string | null) {
  return useQuery({
    queryKey: ['import_jobs', agencyId],
    enabled: !!agencyId,
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ImportJob[];
    },
  });
}

export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ['import_jobs', 'detail', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      if (!jobId) return null;
      
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ImportJob | null;
    },
  });
}

export function useCreateImportJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (job: ImportJobInsert) => {
      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          agency_id: job.agency_id,
          type: job.type,
          file_name: job.file_name,
          file_hash: job.file_hash,
          status: job.status || 'pending',
          created_by_user_id: job.created_by_user_id,
          summary_json: job.summary_json as any,
          diff_json: job.diff_json as any,
          notes: job.notes,
          completed_at: job.status === 'completed' ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ImportJob;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['import_jobs', variables.agency_id] });
    },
  });
}

export function useUpdateImportJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImportJob> & { id: string }) => {
      const { data, error } = await supabase
        .from('import_jobs')
        .update({
          status: updates.status,
          summary_json: updates.summary_json as any,
          diff_json: updates.diff_json as any,
          notes: updates.notes,
          completed_at: updates.status === 'completed' ? new Date().toISOString() : undefined,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ImportJob;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['import_jobs', data.agency_id] });
      queryClient.invalidateQueries({ queryKey: ['import_jobs', 'detail', data.id] });
    },
  });
}
