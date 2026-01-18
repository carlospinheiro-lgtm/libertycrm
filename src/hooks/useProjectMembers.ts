import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  ProjectMember, 
  ProjectMemberRole,
  AddMemberInput 
} from '@/types/projects';

export function useProjectMembers(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_members')
        .select(`
          *,
          user:profiles(id, name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ProjectMember[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCurrentUserProjectRole(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-role', projectId, user?.id],
    queryFn: async (): Promise<ProjectMemberRole | null> => {
      if (!projectId || !user?.id) return null;

      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return data?.role as ProjectMemberRole;
    },
    enabled: !!user && !!projectId,
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMemberInput) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: input.project_id,
          user_id: input.user_id,
          role: input.role || 'member',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', data.project_id] });
      toast.success('Membro adicionado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este utilizador já é membro do projeto');
      } else {
        toast.error(`Erro ao adicionar membro: ${error.message}`);
      }
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      projectId,
      role 
    }: { 
      memberId: string; 
      projectId: string;
      role: ProjectMemberRole;
    }) => {
      const { data, error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', data.projectId] });
      toast.success('Papel atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar papel: ${error.message}`);
    },
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-members', data.projectId] });
      toast.success('Membro removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover membro: ${error.message}`);
    },
  });
}
