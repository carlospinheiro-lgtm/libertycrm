import { useState } from 'react';
import { Team } from '@/hooks/useTeamsSupabase';
import { 
  useTeamMembershipsByTeam, 
  useAddTeamMember, 
  useRemoveTeamMember,
  useSetTeamLeader,
  TeamMemberWithProfile 
} from '@/hooks/useTeamMemberships';
import { useUsersWithDetails } from '@/hooks/useUsersSupabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Crown, 
  UserPlus, 
  UserMinus, 
  Loader2,
  Users as UsersIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ManageTeamMembersDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTeamMembersDialog({ team, open, onOpenChange }: ManageTeamMembersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const { data: members = [], isLoading: membersLoading } = useTeamMembershipsByTeam(team.id);
  const { data: agencyUsers = [], isLoading: usersLoading } = useUsersWithDetails(team.agency_id);
  
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const setLeader = useSetTeamLeader();

  // Get users not already in the team
  const availableUsers = agencyUsers.filter(user => 
    !members.some(m => m.user_id === user.id) && user.isActive
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await addMember.mutateAsync({
        teamId: team.id,
        userId: selectedUserId,
      });
      toast.success('Membro adicionado com sucesso');
      setSelectedUserId('');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = async (member: TeamMemberWithProfile) => {
    try {
      await removeMember.mutateAsync({
        teamId: team.id,
        userId: member.user_id,
      });
      toast.success('Membro removido da equipa');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleSetLeader = async (member: TeamMemberWithProfile) => {
    try {
      await setLeader.mutateAsync({
        teamId: team.id,
        userId: member.user_id,
      });
      toast.success(`${member.profile.name} definido como líder`);
    } catch (error) {
      console.error('Error setting leader:', error);
      toast.error('Erro ao definir líder');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Gerir Membros - {team.name}
          </DialogTitle>
          <DialogDescription>
            Adicione, remova ou defina o líder da equipa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add member section */}
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar utilizador para adicionar..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Todos os utilizadores já estão na equipa
                  </SelectItem>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedUserId || addMember.isPending}
            >
              {addMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span className="ml-2">Adicionar</span>
            </Button>
          </div>

          {/* Members table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Esta equipa ainda não tem membros
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.profile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.profile.name}</span>
                              {member.is_leader && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {member.profile.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_leader ? 'default' : 'secondary'}>
                          {member.is_leader ? 'Líder' : 'Membro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.joined_at ? format(new Date(member.joined_at), "d 'de' MMM yyyy", { locale: pt }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                          {member.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!member.is_leader && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetLeader(member)}
                              disabled={setLeader.isPending}
                              title="Definir como líder"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member)}
                            disabled={removeMember.isPending}
                            title="Remover da equipa"
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total: {members.length} membros</span>
            <span>
              Líder: {members.find(m => m.is_leader)?.profile.name || 'Não definido'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
