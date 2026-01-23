import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Crown, Briefcase, Calculator, Eye } from 'lucide-react';
import { useAgencyActiveUsers } from '@/hooks/useAgencyActiveUsers';
import { useProjectMembers, useAddProjectMember } from '@/hooks/useProjectMembers';
import { useProject } from '@/hooks/useProjects';
import type { ProjectMemberRole } from '@/types/projects';

const roleLabels: Record<ProjectMemberRole, string> = {
  pm: 'Gestor de Projeto',
  member: 'Membro',
  finance: 'Finanças',
  viewer: 'Visualizador',
};

const roleIcons: Record<ProjectMemberRole, React.ReactNode> = {
  pm: <Crown className="h-3.5 w-3.5" />,
  member: <Briefcase className="h-3.5 w-3.5" />,
  finance: <Calculator className="h-3.5 w-3.5" />,
  viewer: <Eye className="h-3.5 w-3.5" />,
};

interface AddProjectMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AddProjectMemberDialog({
  open,
  onOpenChange,
  projectId,
}: AddProjectMemberDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>('member');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: project } = useProject(projectId);
  const { data: agencyUsers = [], isLoading: loadingUsers } = useAgencyActiveUsers(project?.agency_id);
  const { data: members = [] } = useProjectMembers(projectId);
  const addMember = useAddProjectMember();

  // Filtrar utilizadores que já são membros
  const existingMemberIds = new Set(members.map((m) => m.user_id));
  
  const availableUsers = useMemo(() => {
    return agencyUsers
      .filter((u) => !existingMemberIds.has(u.id))
      .filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [agencyUsers, existingMemberIds, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    addMember.mutate(
      {
        project_id: projectId,
        user_id: selectedUserId,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedRole('member');
    setSearchTerm('');
  };

  const selectedUser = agencyUsers.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Procurar Utilizador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2">
              <Label>Selecionar Utilizador</Label>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-md">
                  {searchTerm
                    ? 'Nenhum utilizador encontrado.'
                    : 'Todos os utilizadores da agência já são membros.'}
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                          selectedUserId === user.id
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected User Preview */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Papel no Projeto</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProjectMemberRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pm">
                    <div className="flex items-center gap-2">
                      {roleIcons.pm}
                      <span>{roleLabels.pm}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      {roleIcons.member}
                      <span>{roleLabels.member}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="finance">
                    <div className="flex items-center gap-2">
                      {roleIcons.finance}
                      <span>{roleLabels.finance}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      {roleIcons.viewer}
                      <span>{roleLabels.viewer}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedRole === 'pm' && 'Pode gerir todas as tarefas, membros e configurações do projeto.'}
                {selectedRole === 'member' && 'Pode criar e editar tarefas, mas não pode gerir membros.'}
                {selectedRole === 'finance' && 'Pode gerir orçamento e itens financeiros do projeto.'}
                {selectedRole === 'viewer' && 'Apenas pode visualizar o projeto sem fazer alterações.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedUserId || addMember.isPending}>
              {addMember.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A adicionar...
                </>
              ) : (
                'Adicionar Membro'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
