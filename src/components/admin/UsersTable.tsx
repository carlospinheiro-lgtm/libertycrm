import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers, agencies, teams } from '@/data/rbac-data';
import { roleLabels, RBACUser, AppRole } from '@/types/rbac';
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
import { MoreHorizontal, Search, UserPlus, Pencil, UserX, UserCheck } from 'lucide-react';
import { AddUserDialog } from './AddUserDialog';
import { EditUserDialog } from './EditUserDialog';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export function UsersTable() {
  const { hasPermission, getAgencyName, getTeamName, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<RBACUser | null>(null);

  // Filtrar utilizadores baseado no scope do utilizador atual
  const filteredUsers = mockUsers.filter(user => {
    // Filtro de pesquisa
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de agência
    const matchesAgency = agencyFilter === 'all' || user.agencyId === agencyFilter;
    
    // Filtro de estado
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    // Verificar scope (se não for diretor geral, só vê da sua agência)
    const isDirectorGeral = currentUser?.roles.includes('diretor_geral');
    const sameAgency = !currentUser || isDirectorGeral || user.agencyId === currentUser.agencyId;
    
    return matchesSearch && matchesAgency && matchesStatus && sameAgency;
  });

  const handleToggleStatus = (user: RBACUser) => {
    // Em produção, isto faria uma chamada à API
    console.log(`Toggle status for user ${user.id}`, !user.isActive);
  };

  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar utilizadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Agência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {agencies.map(agency => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <PermissionGuard permission="admin.users.create">
          <Button onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Utilizador
          </Button>
        </PermissionGuard>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Agência</TableHead>
              <TableHead>Equipa</TableHead>
              <TableHead>Funções</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum utilizador encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{getAgencyName(user.agencyId)}</TableCell>
                  <TableCell>
                    {user.teamId ? getTeamName(user.teamId) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {roleLabels[role]}
                        </Badge>
                      ))}
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
                        </PermissionGuard>
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
          user={editingUser} 
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)} 
        />
      )}
    </div>
  );
}
