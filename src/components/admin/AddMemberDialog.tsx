import { useState } from 'react';
import { RBACUser } from '@/types/rbac';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { roleLabels } from '@/types/rbac';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  teamId: string;
  availableUsers: RBACUser[];
  onAddMember: (userId: string, teamId: string) => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  teamName,
  teamId,
  availableUsers,
  onAddMember,
}: AddMemberDialogProps) {
  const [selectedUser, setSelectedUser] = useState('');

  const handleAdd = () => {
    if (!selectedUser) {
      toast.error('Selecione um utilizador');
      return;
    }
    onAddMember(selectedUser, teamId);
    setSelectedUser('');
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Adicionar utilizador à equipa "{teamName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar Utilizador</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher utilizador..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    Sem utilizadores disponíveis
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({user.teamId ? 'Transferir' : 'Sem equipa'})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              {(() => {
                const user = availableUsers.find(u => u.id === selectedUser);
                if (!user) return null;
                return (
                  <div className="space-y-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-muted-foreground">
                      {user.roles.map(r => roleLabels[r] || r).join(', ')}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelectedUser(''); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUser}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
