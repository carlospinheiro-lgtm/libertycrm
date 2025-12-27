import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/rbac';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCircle } from 'lucide-react';

/**
 * Componente para trocar de utilizador durante desenvolvimento
 * Apenas visível em modo de desenvolvimento
 */
export function UserSwitcher() {
  const { currentUser, switchUser, allUsers, getAgencyName } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <UserCircle className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-medium text-amber-600">
          Modo de Desenvolvimento - Trocar Utilizador
        </span>
      </div>
      
      <Select value={currentUser.id} onValueChange={switchUser}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allUsers.filter(u => u.isActive).map(user => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({getAgencyName(user.agencyId)})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="mt-2 flex flex-wrap gap-1">
        {currentUser.roles.map(role => (
          <Badge key={role} variant="secondary" className="text-xs">
            {roleLabels[role]}
          </Badge>
        ))}
      </div>
    </div>
  );
}
