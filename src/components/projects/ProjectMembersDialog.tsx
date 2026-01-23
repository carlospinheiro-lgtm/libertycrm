import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Trash2, Crown, Briefcase, Eye, Calculator, Loader2 } from 'lucide-react';
import { useProjectMembers, useUpdateMemberRole, useRemoveProjectMember } from '@/hooks/useProjectMembers';
import { useAuth } from '@/contexts/AuthContext';
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

const roleBadgeColors: Record<ProjectMemberRole, string> = {
  pm: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  member: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  finance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAddMember: () => void;
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  projectId,
  onAddMember,
}: ProjectMembersDialogProps) {
  const { user } = useAuth();
  const { data: members = [], isLoading } = useProjectMembers(projectId);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveProjectMember();
  
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const handleRoleChange = (memberId: string, newRole: ProjectMemberRole) => {
    updateRole.mutate({ memberId, projectId, role: newRole });
  };

  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeMember.mutate(
        { memberId: memberToRemove.id, projectId },
        { onSettled: () => setMemberToRemove(null) }
      );
    }
  };

  const currentUserIsPM = members.some(
    (m) => m.user_id === user?.id && m.role === 'pm'
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Membros do Projeto</span>
              {currentUserIsPM && (
                <Button size="sm" onClick={onAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum membro neste projeto.</p>
              {currentUserIsPM && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-1">
                {members.map((member, index) => {
                  const isCurrentUser = member.user_id === user?.id;
                  const memberRole = member.role as ProjectMemberRole;
                  const canEditRole = currentUserIsPM && !isCurrentUser;
                  const canRemove = currentUserIsPM && !isCurrentUser;

                  return (
                    <div key={member.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-sm">
                              {member.user?.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {member.user?.name || 'Utilizador desconhecido'}
                              {isCurrentUser && (
                                <span className="text-muted-foreground ml-1">(tu)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.user?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canEditRole ? (
                            <Select
                              value={memberRole}
                              onValueChange={(value) =>
                                handleRoleChange(member.id, value as ProjectMemberRole)
                              }
                              disabled={updateRole.isPending}
                            >
                              <SelectTrigger className="w-[160px] h-8">
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
                          ) : (
                            <Badge
                              variant="secondary"
                              className={`flex items-center gap-1.5 ${roleBadgeColors[memberRole]}`}
                            >
                              {roleIcons[memberRole]}
                              {roleLabels[memberRole]}
                            </Badge>
                          )}

                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setMemberToRemove({
                                  id: member.id,
                                  name: member.user?.name || 'este membro',
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover <strong>{memberToRemove?.name}</strong> deste projeto?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
