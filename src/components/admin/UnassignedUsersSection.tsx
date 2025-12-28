import { RBACUser, Team } from '@/types/rbac';
import { roleLabels } from '@/types/rbac';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users } from 'lucide-react';

interface UnassignedUsersSectionProps {
  users: RBACUser[];
  teams: Team[];
  onAssignUser: (user: RBACUser) => void;
}

export function UnassignedUsersSection({ users, teams, onAssignUser }: UnassignedUsersSectionProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Sem Equipa</span>
          <Badge variant="secondary" className="text-xs">
            {users.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <div
            key={user.id}
            className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-background transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium truncate block">{user.name}</span>
                <p className="text-xs text-muted-foreground truncate">
                  {user.roles.map(r => roleLabels[r] || r).join(', ')}
                </p>
              </div>
            </div>
            
            {teams.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1"
                onClick={() => onAssignUser(user)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Alocar</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
