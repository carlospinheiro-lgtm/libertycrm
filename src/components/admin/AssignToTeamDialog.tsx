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
import { Users } from 'lucide-react';

interface AssignToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: RBACUser | null;
  availableTeams: Team[];
  onAssign: (userId: string, teamId: string) => void;
}

export function AssignToTeamDialog({
  open,
  onOpenChange,
  user,
  availableTeams,
  onAssign,
}: AssignToTeamDialogProps) {
  const [selectedTeam, setSelectedTeam] = useState('');

  const handleAssign = () => {
    if (!user || !selectedTeam) return;
    onAssign(user.id, selectedTeam);
    setSelectedTeam('');
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alocar a Equipa</DialogTitle>
          <DialogDescription>
            Alocar {user.name} a uma equipa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Equipa</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher equipa..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    Sem equipas disponíveis
                  </div>
                ) : (
                  availableTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{team.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelectedTeam(''); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedTeam}>
            Alocar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
