import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Users, UsersRound, Trash2 } from 'lucide-react';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useUserAgenciesByAgency } from '@/hooks/useUsersSupabase';

interface DeleteAgencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function DeleteAgencyDialog({
  open,
  onOpenChange,
  agencyId,
  agencyName,
  onConfirmDelete,
  isDeleting,
}: DeleteAgencyDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  
  const { data: teams, isLoading: teamsLoading } = useTeamsByAgency(agencyId);
  const { data: userAgencies, isLoading: usersLoading } = useUserAgenciesByAgency(agencyId);
  
  const isLoading = teamsLoading || usersLoading;
  
  // Count active items
  const activeTeamsCount = teams?.filter(t => t.is_active).length || 0;
  const activeUsersCount = userAgencies?.filter(ua => ua.is_active).length || 0;
  
  const hasDependencies = activeTeamsCount > 0 || activeUsersCount > 0;
  const canDelete = !hasDependencies && confirmationText === agencyName;
  
  // Reset confirmation text when dialog opens
  useEffect(() => {
    if (open) {
      setConfirmationText('');
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Eliminar Agência
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. A agência "{agencyName}" será permanentemente eliminada.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : hasDependencies ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Não é possível eliminar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta agência tem itens ativos que devem ser removidos ou desativados primeiro.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {activeUsersCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Utilizadores ativos</span>
                  </div>
                  <Badge variant="secondary">{activeUsersCount}</Badge>
                </div>
              )}
              
              {activeTeamsCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Equipas ativas</span>
                  </div>
                  <Badge variant="secondary">{activeTeamsCount}</Badge>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Desative ou mova estes itens para outra agência antes de eliminar.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Confirmar eliminação</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Escreva o nome da agência para confirmar a eliminação.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency-name-confirm">
                Escreva "{agencyName}" para confirmar
              </Label>
              <Input
                id="agency-name-confirm"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={agencyName}
                autoComplete="off"
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!hasDependencies && (
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? 'A eliminar...' : 'Eliminar Agência'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
