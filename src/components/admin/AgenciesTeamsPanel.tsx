import { useState } from 'react';
import { useAgenciesWithStats, useToggleAgencyActive, useDeleteAgency } from '@/hooks/useAgenciesCrud';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useUserAgenciesByAgency } from '@/hooks/useUsersSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncBadge } from '@/components/ui/sync-badge';
import { Building2, Users, UserCircle, Plus, ChevronDown, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddAgencyDialog } from './AddAgencyDialog';
import { DeleteAgencyDialog } from './DeleteAgencyDialog';

interface TeamWithMembers {
  id: string;
  name: string;
  is_synced?: boolean | null;
  last_synced_at?: string | null;
  leader_user_id?: string | null;
  memberCount: number;
}

interface AgencyPanelContentProps {
  agencyId: string;
  agencyName: string;
  isActive: boolean;
}

function AgencyPanelContent({ agencyId, agencyName, isActive }: AgencyPanelContentProps) {
  const { data: teams, isLoading: teamsLoading } = useTeamsByAgency(agencyId);
  const { data: userAgencies, isLoading: usersLoading } = useUserAgenciesByAgency(agencyId);
  
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  
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
  
  const activeTeams = teams?.filter(t => t.is_active) || [];
  const activeUsers = userAgencies?.filter(ua => ua.is_active) || [];
  
  const getUsersByTeam = (teamId: string) => {
    return activeUsers.filter(ua => ua.team_id === teamId);
  };
  
  const getUnassignedUsers = () => {
    return activeUsers.filter(ua => !ua.team_id);
  };
  
  const getLeaderName = (leaderId?: string | null) => {
    if (!leaderId) return null;
    const leaderAgency = userAgencies?.find(ua => ua.user_id === leaderId);
    return (leaderAgency?.profiles as any)?.name;
  };
  
  const isLoading = teamsLoading || usersLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  
  const unassignedUsers = getUnassignedUsers();
  
  return (
    <div className="space-y-4">
      {activeTeams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma equipa ativa
        </p>
      ) : (
        <div className="grid gap-3">
          {activeTeams.map(team => {
            const teamUsers = getUsersByTeam(team.id);
            const leaderName = getLeaderName(team.leader_user_id);
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
                        {team.is_synced && (
                          <SyncBadge 
                            isSynced={team.is_synced} 
                            lastSyncedAt={team.last_synced_at} 
                            size="sm" 
                          />
                        )}
                        <ChevronDown 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  
                  {leaderName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>Líder: {leaderName}</span>
                    </div>
                  )}

                  <CollapsibleContent>
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {teamUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum membro</p>
                      ) : (
                        teamUsers.map(ua => {
                          const profile = ua.profiles as any;
                          return (
                            <div 
                              key={ua.id} 
                              className="flex items-center gap-2 text-sm py-1"
                            >
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {profile?.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span>{profile?.name || 'Sem nome'}</span>
                              {ua.is_synced && (
                                <SyncBadge 
                                  isSynced={ua.is_synced} 
                                  lastSyncedAt={ua.last_synced_at} 
                                  size="sm" 
                                />
                              )}
                              {ua.user_id === team.leader_user_id && (
                                <Badge variant="outline" className="text-xs">Líder</Badge>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Utilizadores sem equipa */}
      {unassignedUsers.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Sem equipa atribuída</span>
            <Badge variant="outline" className="text-xs">
              {unassignedUsers.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {unassignedUsers.slice(0, 5).map(ua => {
              const profile = ua.profiles as any;
              return (
                <div 
                  key={ua.id} 
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span>{profile?.name || 'Sem nome'}</span>
                  {ua.is_synced && (
                    <SyncBadge 
                      isSynced={ua.is_synced} 
                      lastSyncedAt={ua.last_synced_at} 
                      size="sm" 
                    />
                  )}
                </div>
              );
            })}
            {unassignedUsers.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{unassignedUsers.length - 5} mais
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgenciesTeamsPanel() {
  const { data: agencies, isLoading } = useAgenciesWithStats();
  const toggleActive = useToggleAgencyActive();
  const deleteAgency = useDeleteAgency();
  const { hasPermission } = useAuth();
  
  const canDeleteAgency = hasPermission('admin.settings.update');
  
  const [addAgencyOpen, setAddAgencyOpen] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<{id: string; name: string; newState: boolean} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string; name: string} | null>(null);

  const handleToggleAgency = async () => {
    if (!toggleConfirm) return;
    
    try {
      await toggleActive.mutateAsync({
        id: toggleConfirm.id,
        isActive: toggleConfirm.newState,
      });
      toast.success(
        toggleConfirm.newState 
          ? `Agência "${toggleConfirm.name}" ativada` 
          : `Agência "${toggleConfirm.name}" desativada`
      );
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setToggleConfirm(null);
    }
  };

  const handleDeleteAgency = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteAgency.mutateAsync(deleteConfirm.id);
      toast.success(`Agência "${deleteConfirm.name}" eliminada com sucesso`);
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(`Erro ao eliminar: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Agências & Equipas</h3>
          <p className="text-sm text-muted-foreground">
            Gerir estrutura organizacional ({agencies?.length || 0} agências)
          </p>
        </div>
        <Button onClick={() => setAddAgencyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Agência
        </Button>
      </div>

      {/* Agências e suas equipas */}
      <div className="grid gap-6">
        {agencies?.map(agency => (
          <Card key={agency.id} className={!agency.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {agency.name}
                      {agency.remax_code && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {agency.remax_code}
                        </Badge>
                      )}
                      {!agency.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inativa
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {agency.userCount} utilizadores · {agency.teamCount} equipas
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {agency.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                        <Switch
                          checked={agency.is_active ?? false}
                          onCheckedChange={(checked) => {
                            setToggleConfirm({
                              id: agency.id,
                              name: agency.name,
                              newState: checked,
                            });
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {agency.is_active ? 'Desativar agência' : 'Ativar agência'}
                    </TooltipContent>
                  </Tooltip>
                  
                  {canDeleteAgency && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteConfirm({ id: agency.id, name: agency.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar agência</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AgencyPanelContent 
                agencyId={agency.id} 
                agencyName={agency.name}
                isActive={agency.is_active ?? false}
              />
            </CardContent>
          </Card>
        ))}
        
        {(!agencies || agencies.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma agência registada</p>
              <Button className="mt-4" onClick={() => setAddAgencyOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira agência
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Agency Dialog */}
      <AddAgencyDialog
        open={addAgencyOpen}
        onOpenChange={setAddAgencyOpen}
      />

      {/* Toggle Confirmation */}
      <AlertDialog open={!!toggleConfirm} onOpenChange={(open) => !open && setToggleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleConfirm?.newState ? 'Ativar agência?' : 'Desativar agência?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleConfirm?.newState 
                ? `A agência "${toggleConfirm?.name}" será ativada e ficará visível na plataforma.`
                : `A agência "${toggleConfirm?.name}" será desativada. Os utilizadores e equipas permanecerão, mas não serão visíveis.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleAgency}
              className={toggleConfirm?.newState ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {toggleConfirm?.newState ? 'Ativar' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Agency Dialog */}
      {deleteConfirm && (
        <DeleteAgencyDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          agencyId={deleteConfirm.id}
          agencyName={deleteConfirm.name}
          onConfirmDelete={handleDeleteAgency}
          isDeleting={deleteAgency.isPending}
        />
      )}
    </div>
  );
}
