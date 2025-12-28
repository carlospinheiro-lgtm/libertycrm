import { useState } from 'react';
import { agencies, teams, mockUsers } from '@/data/rbac-data';
import { RBACUser, Team } from '@/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Building2, Users, UserCircle, Plus, Pencil, ChevronDown, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { TeamMembersList } from './TeamMembersList';
import { UnassignedUsersSection } from './UnassignedUsersSection';
import { AddMemberDialog } from './AddMemberDialog';
import { MoveMemberDialog } from './MoveMemberDialog';
import { AssignToTeamDialog } from './AssignToTeamDialog';

export function AgenciesTeamsPanel() {
  // Team dialogs
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamAgency, setNewTeamAgency] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');

  // Member management
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberTeam, setAddMemberTeam] = useState<Team | null>(null);
  const [moveMemberOpen, setMoveMemberOpen] = useState(false);
  const [moveMemberUser, setMoveMemberUser] = useState<RBACUser | null>(null);
  const [moveMemberTeamId, setMoveMemberTeamId] = useState('');
  const [assignToTeamOpen, setAssignToTeamOpen] = useState(false);
  const [assignToTeamUser, setAssignToTeamUser] = useState<RBACUser | null>(null);
  const [assignToTeamAgencyId, setAssignToTeamAgencyId] = useState('');
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeUser, setRemoveUser] = useState<RBACUser | null>(null);

  // Collapsible state for teams
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const getTeamsByAgency = (agencyId: string) => teams.filter(t => t.agencyId === agencyId);
  
  const getUsersByTeam = (teamId: string) => mockUsers.filter(u => u.teamId === teamId && u.isActive);
  
  const getUnassignedUsers = (agencyId: string) => 
    mockUsers.filter(u => u.agencyId === agencyId && !u.teamId && u.isActive);

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return null;
    const leader = mockUsers.find(u => u.id === leaderId);
    return leader?.name;
  };

  const getPotentialLeaders = (agencyId: string) => {
    return mockUsers.filter(u => 
      u.agencyId === agencyId && 
      u.isActive && 
      (u.roles.includes('lider_equipa') || u.roles.includes('diretor_comercial'))
    );
  };

  const getAvailableUsersForTeam = (teamId: string, agencyId: string) => {
    return mockUsers.filter(u => 
      u.agencyId === agencyId && 
      u.isActive && 
      u.teamId !== teamId
    );
  };

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleAddTeam = () => {
    if (!newTeamName || !newTeamAgency) {
      toast.error('Preencha o nome e a agência');
      return;
    }
    
    console.log('Creating team:', { name: newTeamName, agencyId: newTeamAgency, leaderUserId: newTeamLeader || undefined });
    toast.success('Equipa criada com sucesso');
    setAddTeamOpen(false);
    resetForm();
  };

  const handleEditTeam = () => {
    if (!newTeamName) {
      toast.error('Preencha o nome da equipa');
      return;
    }
    
    console.log('Updating team:', { id: editingTeamId, name: newTeamName, leaderUserId: newTeamLeader || undefined });
    toast.success('Equipa atualizada com sucesso');
    setEditingTeamId(null);
    resetForm();
  };

  const openEditDialog = (team: Team) => {
    setEditingTeamId(team.id);
    setNewTeamName(team.name);
    setNewTeamAgency(team.agencyId);
    setNewTeamLeader(team.leaderUserId || '');
  };

  const resetForm = () => {
    setNewTeamName('');
    setNewTeamAgency('');
    setNewTeamLeader('');
  };

  // Member management handlers
  const openAddMemberDialog = (team: Team) => {
    setAddMemberTeam(team);
    setAddMemberOpen(true);
  };

  const openMoveMemberDialog = (user: RBACUser, currentTeamId: string) => {
    setMoveMemberUser(user);
    setMoveMemberTeamId(currentTeamId);
    setMoveMemberOpen(true);
  };

  const openRemoveConfirm = (user: RBACUser) => {
    setRemoveUser(user);
    setRemoveConfirmOpen(true);
  };

  const openAssignToTeamDialog = (user: RBACUser, agencyId: string) => {
    setAssignToTeamUser(user);
    setAssignToTeamAgencyId(agencyId);
    setAssignToTeamOpen(true);
  };

  const handleAddMember = (userId: string, teamId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    const team = teams.find(t => t.id === teamId);
    console.log('Adding member to team:', { userId, teamId });
    toast.success(`${user?.name} adicionado à equipa ${team?.name}`);
  };

  const handleMoveMember = (userId: string, newTeamId: string | null) => {
    const user = mockUsers.find(u => u.id === userId);
    if (newTeamId) {
      const team = teams.find(t => t.id === newTeamId);
      console.log('Moving member to team:', { userId, newTeamId });
      toast.success(`${user?.name} movido para ${team?.name}`);
    } else {
      console.log('Removing member from team:', { userId });
      toast.success(`${user?.name} removido da equipa`);
    }
  };

  const handleRemoveMember = () => {
    if (!removeUser) return;
    console.log('Removing member from team:', { userId: removeUser.id });
    toast.success(`${removeUser.name} removido da equipa`);
    setRemoveConfirmOpen(false);
    setRemoveUser(null);
  };

  const handleAssignToTeam = (userId: string, teamId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    const team = teams.find(t => t.id === teamId);
    console.log('Assigning user to team:', { userId, teamId });
    toast.success(`${user?.name} alocado à equipa ${team?.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Agências & Equipas</h3>
          <p className="text-sm text-muted-foreground">
            Gerir estrutura organizacional e membros
          </p>
        </div>
        <Button onClick={() => setAddTeamOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipa
        </Button>
      </div>

      {/* Agências e suas equipas */}
      <div className="grid gap-6">
        {agencies.map(agency => {
          const agencyTeams = getTeamsByAgency(agency.id);
          const agencyUsers = mockUsers.filter(u => u.agencyId === agency.id && u.isActive);
          const unassignedUsers = getUnassignedUsers(agency.id);
          
          return (
            <Card key={agency.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agency.name}</CardTitle>
                    <CardDescription>
                      {agencyUsers.length} utilizadores · {agencyTeams.length} equipas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {agencyTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma equipa criada
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {agencyTeams.map(team => {
                      const teamUsers = getUsersByTeam(team.id);
                      const leaderName = getLeaderName(team.leaderUserId);
                      const isExpanded = expandedTeams.has(team.id);
                      
                      return (
                        <Collapsible
                          key={team.id}
                          open={isExpanded}
                          onOpenChange={() => toggleTeamExpanded(team.id)}
                        >
                          <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{team.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {teamUsers.length}
                                  </Badge>
                                  <ChevronDown 
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                  />
                                </button>
                              </CollapsibleTrigger>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openAddMemberDialog(team)}
                                    >
                                      <UserPlus className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Adicionar membro</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditDialog(team)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar equipa</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            
                            {leaderName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <UserCircle className="h-3.5 w-3.5" />
                                <span>Líder: {leaderName}</span>
                              </div>
                            )}

                            <CollapsibleContent>
                              <TeamMembersList
                                members={teamUsers}
                                leaderId={team.leaderUserId}
                                onMove={(user) => openMoveMemberDialog(user, team.id)}
                                onRemove={openRemoveConfirm}
                              />
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}

                {/* Utilizadores sem equipa */}
                <UnassignedUsersSection
                  users={unassignedUsers}
                  teams={agencyTeams}
                  onAssignUser={(user) => openAssignToTeamDialog(user, agency.id)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog para adicionar equipa */}
      <Dialog open={addTeamOpen} onOpenChange={setAddTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Equipa</DialogTitle>
            <DialogDescription>Crie uma nova equipa numa agência</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Agência *</Label>
              <Select value={newTeamAgency} onValueChange={setNewTeamAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar agência" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map(agency => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nome da Equipa *</Label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ex: Equipa Alpha"
              />
            </div>
            
            {newTeamAgency && (
              <div className="space-y-2">
                <Label>Líder de Equipa</Label>
                <Select value={newTeamLeader || "_none_"} onValueChange={(v) => setNewTeamLeader(v === "_none_" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar líder (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Sem líder</SelectItem>
                    {getPotentialLeaders(newTeamAgency).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddTeamOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddTeam}>Criar Equipa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar equipa */}
      <Dialog open={!!editingTeamId} onOpenChange={(open) => { if (!open) { setEditingTeamId(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipa</DialogTitle>
            <DialogDescription>Atualize os dados da equipa</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Equipa *</Label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ex: Equipa Alpha"
              />
            </div>
            
            {newTeamAgency && (
              <div className="space-y-2">
                <Label>Líder de Equipa</Label>
                <Select value={newTeamLeader || "_none_"} onValueChange={(v) => setNewTeamLeader(v === "_none_" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar líder (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Sem líder</SelectItem>
                    {getPotentialLeaders(newTeamAgency).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingTeamId(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleEditTeam}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        teamName={addMemberTeam?.name || ''}
        teamId={addMemberTeam?.id || ''}
        availableUsers={addMemberTeam ? getAvailableUsersForTeam(addMemberTeam.id, addMemberTeam.agencyId) : []}
        onAddMember={handleAddMember}
      />

      {/* Move Member Dialog */}
      <MoveMemberDialog
        open={moveMemberOpen}
        onOpenChange={setMoveMemberOpen}
        user={moveMemberUser}
        currentTeamId={moveMemberTeamId}
        availableTeams={moveMemberUser ? getTeamsByAgency(moveMemberUser.agencyId) : []}
        onMoveMember={handleMoveMember}
      />

      {/* Assign to Team Dialog */}
      <AssignToTeamDialog
        open={assignToTeamOpen}
        onOpenChange={setAssignToTeamOpen}
        user={assignToTeamUser}
        availableTeams={assignToTeamAgencyId ? getTeamsByAgency(assignToTeamAgencyId) : []}
        onAssign={handleAssignToTeam}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da equipa?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeUser?.name} será removido da equipa e ficará sem equipa atribuída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
