import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAgencies } from '@/hooks/useAgencies';
import { useTeamsByAgency, Team } from '@/hooks/useTeamsSupabase';
import { useTeamMembershipsByTeam } from '@/hooks/useTeamMemberships';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  Plus, 
  Pencil, 
  Users as UsersIcon, 
  Archive,
  Eye,
  RefreshCw,
  Loader2,
  UserCheck
} from 'lucide-react';
import { SyncBadge } from '@/components/ui/sync-badge';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { AddTeamDialog } from './AddTeamDialog';
import { EditTeamDialog } from './EditTeamDialog';
import { ManageTeamMembersDialog } from './ManageTeamMembersDialog';

interface TeamWithMemberCount extends Team {
  memberCount?: number;
  leaderName?: string;
}

export function TeamsPanel() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingMembersTeam, setManagingMembersTeam] = useState<Team | null>(null);

  // Fetch agencies
  const { data: agencies = [], isLoading: agenciesLoading } = useActiveAgencies();
  
  // Fetch teams for selected agency
  const { data: teams = [], isLoading: teamsLoading, refetch } = useTeamsByAgency(selectedAgencyId || null);

  // Filter teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.nickname?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && team.is_active) ||
      (statusFilter === 'inactive' && !team.is_active) ||
      (statusFilter === 'synced' && team.is_synced);
    
    return matchesSearch && matchesStatus;
  });

  const handleArchiveTeam = async (team: Team) => {
    // TODO: Implement archive mutation
    console.log(`Archive team ${team.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          {/* Agency selector - required */}
          <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar agência..." />
            </SelectTrigger>
            <SelectContent>
              {agencies.map(agency => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar equipas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={!selectedAgencyId}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!selectedAgencyId}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
              <SelectItem value="synced">Importadas</SelectItem>
            </SelectContent>
          </Select>

          {selectedAgencyId && (
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={teamsLoading}>
              <RefreshCw className={`h-4 w-4 ${teamsLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        <PermissionGuard permission="admin.users.create">
          <Button onClick={() => setAddDialogOpen(true)} disabled={!selectedAgencyId}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Equipa
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Equipa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Líder</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedAgencyId ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Selecione uma agência para ver as equipas
                </TableCell>
              </TableRow>
            ) : teamsLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma equipa encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
                <TeamRow 
                  key={team.id} 
                  team={team}
                  onEdit={() => setEditingTeam(team)}
                  onManageMembers={() => setManagingMembersTeam(team)}
                  onArchive={() => handleArchiveTeam(team)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddTeamDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        agencyId={selectedAgencyId}
      />
      
      {editingTeam && (
        <EditTeamDialog 
          team={editingTeam}
          open={!!editingTeam} 
          onOpenChange={(open) => !open && setEditingTeam(null)} 
        />
      )}
      
      {managingMembersTeam && (
        <ManageTeamMembersDialog
          team={managingMembersTeam}
          open={!!managingMembersTeam}
          onOpenChange={(open) => !open && setManagingMembersTeam(null)}
        />
      )}
    </div>
  );
}

interface TeamRowProps {
  team: Team;
  onEdit: () => void;
  onManageMembers: () => void;
  onArchive: () => void;
}

function TeamRow({ team, onEdit, onManageMembers, onArchive }: TeamRowProps) {
  const { data: members = [] } = useTeamMembershipsByTeam(team.id);
  
  const leader = members.find(m => m.is_leader);
  const memberCount = members.length;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              {team.name}
              {team.is_synced && <SyncBadge />}
            </div>
            {team.nickname && (
              <span className="text-xs text-muted-foreground">{team.nickname}</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {team.team_type || 'comercial'}
        </Badge>
      </TableCell>
      <TableCell>
        {leader ? (
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>{leader.profile.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <span>{memberCount}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={team.is_active ? 'default' : 'outline'}>
          {team.is_active ? 'Ativa' : 'Inativa'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onManageMembers}>
              <UsersIcon className="h-4 w-4 mr-2" />
              Gerir Membros
            </DropdownMenuItem>
            <PermissionGuard permission="admin.users.update">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            </PermissionGuard>
            <DropdownMenuSeparator />
            <PermissionGuard permission="admin.users.disable">
              <DropdownMenuItem onClick={onArchive} className="text-destructive">
                <Archive className="h-4 w-4 mr-2" />
                {team.is_active ? 'Arquivar' : 'Reativar'}
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
