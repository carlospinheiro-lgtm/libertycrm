import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useAddTeamMember } from '@/hooks/useTeamMemberships';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';

interface MoveToTeamDialogProps {
  userId: string;
  userName: string;
  agencyId: string;
  currentTeamId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveToTeamDialog({ 
  userId, 
  userName, 
  agencyId, 
  currentTeamId,
  open, 
  onOpenChange 
}: MoveToTeamDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: teams = [], isLoading: teamsLoading } = useTeamsByAgency(agencyId);
  const addMember = useAddTeamMember();

  // Filter out current team and inactive teams
  const availableTeams = teams.filter(t => t.id !== currentTeamId && t.is_active);

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      toast.error('Selecione uma equipa');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add to new team membership
      await addMember.mutateAsync({
        teamId: selectedTeamId,
        userId: userId,
      });

      // Also update user_agencies.team_id for compatibility
      await supabase
        .from('user_agencies')
        .update({ team_id: selectedTeamId })
        .eq('user_id', userId)
        .eq('agency_id', agencyId);

      toast.success(`${userName} movido para a nova equipa`);
      queryClient.invalidateQueries({ queryKey: ['users-with-details', agencyId] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving user to team:', error);
      toast.error('Erro ao mover utilizador para a equipa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mover para Equipa
          </DialogTitle>
          <DialogDescription>
            Mover <strong>{userName}</strong> para outra equipa da agência.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="team">Selecionar Equipa</Label>
            <Select 
              value={selectedTeamId} 
              onValueChange={setSelectedTeamId}
              disabled={teamsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolher equipa..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Nenhuma equipa disponível
                  </SelectItem>
                ) : (
                  availableTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                      {team.nickname && ` (${team.nickname})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTeamId || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
