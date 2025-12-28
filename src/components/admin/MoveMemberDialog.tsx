import { useState } from 'react';
import { Team, RBACUser } from '@/types/rbac';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Users, UserMinus } from 'lucide-react';

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

  const handleMove = () => {
    if (!user) return;
    const newTeamId = targetTeam === '__remove__' ? null : targetTeam;
    onMoveMember(user.id, newTeamId);
    setTargetTeam('');
    onOpenChange(false);
  };

  const filteredTeams = availableTeams.filter(t => t.id !== currentTeamId);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Membro</DialogTitle>
          <DialogDescription>
            Mover {user.name} para outra equipa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destino</Label>
            <Select value={targetTeam} onValueChange={setTargetTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher destino..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__remove__">
                  <div className="flex items-center gap-2 text-destructive">
                    <UserMinus className="h-4 w-4" />
                    <span>Remover da equipa</span>
                  </div>
                </SelectItem>
                {filteredTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setTargetTeam(''); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!targetTeam}
            variant={targetTeam === '__remove__' ? 'destructive' : 'default'}
          >
            {targetTeam === '__remove__' ? 'Remover' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
