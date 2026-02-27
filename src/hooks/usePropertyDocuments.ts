import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbPropertyDocument {
  id: string;
  property_id: string;
  document_type: string;
  file_url: string;
  file_name: string | null;
  expiry_date: string | null;
  version: number;
  uploaded_by: string | null;
  created_at: string;
}

export function usePropertyDocuments(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-documents', propertyId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbPropertyDocument[];
    },
    enabled: !!user && !!propertyId,
  });

  const addDocument = useMutation({
    mutationFn: async (doc: Omit<DbPropertyDocument, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('property_documents').insert(doc);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Documento adicionado');
    },
    onError: (e: any) => toast.error('Erro: ' + e.message),
  });

  return { documents, isLoading, addDocument };
}
