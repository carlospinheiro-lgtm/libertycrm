import { useState, useEffect } from 'react';
import { Team, RBACUser } from '@/types/rbac';
import { mockUsers } from '@/data/rbac-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, UserMinus, Crown, AlertTriangle } from 'lucide-react';

interface MoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: RBACUser | null;
  currentTeamId: string;
  availableTeams: Team[];
  onMoveMember: (userId: string, newTeamId: string | null) => void;
}

export function MoveMemberDialog({
  open,
  onOpenChange,
  user,
  currentTeamId,
  availableTeams,
  onMoveMember,
}: MoveMemberDialogProps) {
  const [targetTeam, setTargetTeam] = useState('');

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setTargetTeam('');
    }
  }, [open]);

  const handleMove = () => {
    if (!user) return;
    const newTeamId = targetTeam === '__remove__' ? null : targetTeam;
    onMoveMember(user.id, newTeamId);
    setTargetTeam('');
    onOpenChange(false);
  };

  const handleRemove = () => {
    if (!user) return;
    onMoveMember(user.id, null);
    setTargetTeam('');
    onOpenChange(false);
  };

  const filteredTeams = availableTeams.filter(t => t.id !== currentTeamId);

  const getTeamMemberCount = (teamId: string) => {
    return mockUsers.filter(u => u.teamId === teamId && u.isActive).length;
  };

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return null;
    const leader = mockUsers.find(u => u.id === leaderId);
    return leader?.name;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover Membro</DialogTitle>
          <DialogDescription>
            Mover <span className="font-medium text-foreground">{user.name}</span> para outra equipa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {filteredTeams.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selecionar equipa de destino:</Label>
                <RadioGroup value={targetTeam} onValueChange={setTargetTeam} className="space-y-2">
                  {filteredTeams.map(team => {
                    const memberCount = getTeamMemberCount(team.id);
                    const leaderName = getLeaderName(team.leaderUserId);
                    
                    return (
                      <div key={team.id}>
                        <Label
                          htmlFor={team.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                            targetTeam === team.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                          }`}
                        >
                          <RadioGroupItem value={team.id} id={team.id} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{team.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {leaderName ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" />
                                  {leaderName}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/70">Sem líder</span>
                              )}
                              <span>·</span>
                              <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Não existem outras equipas disponíveis nesta agência</p>
            </div>
          )}

          {/* Zona de Risco - Remover da equipa */}
          <div className="pt-2">
            <Separator className="mb-4" />
            <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Zona de Risco</p>
                  <p className="text-xs text-muted-foreground">
                    O membro ficará sem equipa atribuída
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={handleRemove}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remover da equipa
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { setTargetTeam(''); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!targetTeam || targetTeam === '__remove__'}
          >
            Mover para Equipa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
