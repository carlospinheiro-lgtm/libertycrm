import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAgencies } from '@/hooks/useAgencies';
import { useUsersWithDetails, UserWithDetails } from '@/hooks/useUsersSupabase';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { roleLabels, AppRole } from '@/types/rbac';
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
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, UserPlus, Pencil, UserX, UserCheck, RefreshCw, Loader2, Users, ArrowRight } from 'lucide-react';
import { AddUserDialog } from './AddUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { MoveToTeamDialog } from './MoveToTeamDialog';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { SyncBadge } from '@/components/ui/sync-badge';

export function UsersTable() {
  const { hasPermission, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [movingToTeamUser, setMovingToTeamUser] = useState<UserWithDetails | null>(null);

  // Fetch agencies
  const { data: agencies = [], isLoading: agenciesLoading } = useActiveAgencies();
  
  // Fetch users for selected agency
  const { data: users = [], isLoading: usersLoading, refetch } = useUsersWithDetails(selectedAgencyId || null);
  
  // Fetch teams for agency names display
  const { data: teams = [] } = useTeamsByAgency(selectedAgencyId || null);

  // Filter users
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive) ||
      (statusFilter === 'synced' && user.isSynced);
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (user: UserWithDetails) => {
    // TODO: Implement status toggle mutation
    console.log(`Toggle status for user ${user.id}`, !user.isActive);
  };

  const getAgencyName = (agencyId: string) => {
    return agencies.find(a => a.id === agencyId)?.name || agencyId;
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return '-';
    return teams.find(t => t.id === teamId)?.name || teamId;
  };

  // Convert UserWithDetails to format expected by EditUserDialog
  const convertToRBACUser = (user: UserWithDetails) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    agencyId: user.agencyId,
    teamId: user.teamId || undefined,
    roles: user.roles as AppRole[],
    isActive: user.isActive,
    createdAt: new Date(),
  });

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
              placeholder="Pesquisar utilizadores..."
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
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="synced">Importados</SelectItem>
            </SelectContent>
          </Select>

          {selectedAgencyId && (
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={usersLoading}>
              <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        <PermissionGuard permission="admin.users.create">
          <Button onClick={() => setAddDialogOpen(true)} disabled={!selectedAgencyId}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Utilizador
          </Button>
        </PermissionGuard>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Equipa</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedAgencyId ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Selecione uma agência para ver os utilizadores
                </TableCell>
              </TableRow>
            ) : usersLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.name}
                      {user.isSynced && <SyncBadge />}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{user.teamName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {roleLabels[role] || role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'outline'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
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
                        <PermissionGuard permission="admin.users.update">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMovingToTeamUser(user)}>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Mover para Equipa
                          </DropdownMenuItem>
                        </PermissionGuard>
                        {user.teamId && (
                          <DropdownMenuItem onClick={() => {
                            // Navigate to teams tab with team highlighted
                            const tabsTrigger = document.querySelector('[value="teams"]') as HTMLButtonElement;
                            if (tabsTrigger) tabsTrigger.click();
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Ver Equipa
                          </DropdownMenuItem>
                        )}
                        <PermissionGuard permission="admin.users.disable">
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddUserDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {editingUser && (
        <EditUserDialog 
          user={convertToRBACUser(editingUser)} 
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)} 
        />
      )}
      {movingToTeamUser && (
        <MoveToTeamDialog
          userId={movingToTeamUser.id}
          userName={movingToTeamUser.name}
          agencyId={movingToTeamUser.agencyId}
          currentTeamId={movingToTeamUser.teamId}
          open={!!movingToTeamUser}
          onOpenChange={(open) => !open && setMovingToTeamUser(null)}
        />
      )}
    </div>
  );
}
