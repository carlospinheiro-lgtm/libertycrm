import { useState } from 'react';
import { agencies, teams, mockUsers } from '@/data/rbac-data';
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
import { Building2, Users, UserCircle, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export function AgenciesTeamsPanel() {
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamAgency, setNewTeamAgency] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');

  const getTeamsByAgency = (agencyId: string) => teams.filter(t => t.agencyId === agencyId);
  
  const getUsersByTeam = (teamId: string) => mockUsers.filter(u => u.teamId === teamId && u.isActive);
  
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

  const openEditDialog = (team: typeof teams[0]) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Agências & Equipas</h3>
          <p className="text-sm text-muted-foreground">
            Gerir estrutura organizacional
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
              <CardContent>
                {agencyTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma equipa criada
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {agencyTeams.map(team => {
                      const teamUsers = getUsersByTeam(team.id);
                      const leaderName = getLeaderName(team.leaderUserId);
                      
                      return (
                        <div
                          key={team.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{team.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(team)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {leaderName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <UserCircle className="h-3.5 w-3.5" />
                              <span>Líder: {leaderName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {teamUsers.length} membros
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <Select value={newTeamLeader} onValueChange={setNewTeamLeader}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar líder (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem líder</SelectItem>
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
                <Select value={newTeamLeader} onValueChange={setNewTeamLeader}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar líder (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem líder</SelectItem>
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
    </div>
  );
}
