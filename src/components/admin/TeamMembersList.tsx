import { RBACUser } from '@/types/rbac';
import { roleLabels } from '@/types/rbac';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowRightLeft, UserMinus, Crown } from 'lucide-react';

interface TeamMembersListProps {
  members: RBACUser[];
  leaderId?: string;
  onMove: (user: RBACUser) => void;
  onRemove: (user: RBACUser) => void;
}

export function TeamMembersList({ members, leaderId, onMove, onRemove }: TeamMembersListProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (members.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-3 border-t">
        Sem membros na equipa
      </div>
    );
  }

  return (
    <div className="border-t mt-3 pt-3 space-y-2">
      {members.map(user => {
        const isLeader = user.id === leaderId;
        return (
          <div
            key={user.id}
            className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  {isLeader && (
                    <Badge variant="outline" className="text-xs gap-1 shrink-0">
                      <Crown className="h-3 w-3" />
                      Líder
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.roles.map(r => roleLabels[r] || r).join(', ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onMove(user)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover para outra equipa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRemove(user)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remover da equipa</TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
