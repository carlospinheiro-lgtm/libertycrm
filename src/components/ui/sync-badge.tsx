import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { RefreshCcw, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncBadgeProps {
  isSynced?: boolean | null;
  lastSyncedAt?: string | null;
  size?: 'sm' | 'default';
  showLock?: boolean;
}

export function SyncBadge({ 
  isSynced, 
  lastSyncedAt, 
  size = 'default',
  showLock = false 
}: SyncBadgeProps) {
  if (!isSynced) return null;
  
  const formattedDate = lastSyncedAt 
    ? format(new Date(lastSyncedAt), "d MMM yyyy 'às' HH:mm", { locale: pt })
    : 'Data desconhecida';
  
  const iconClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const badgeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={`gap-1 ${badgeClass} bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 cursor-help`}
        >
          {showLock ? (
            <Lock className={iconClass} />
          ) : (
            <RefreshCcw className={iconClass} />
          )}
          MAXWORK
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-medium">Gerido por importação MAXWORK</p>
          <p className="text-muted-foreground">Última sincronização: {formattedDate}</p>
          {showLock && (
            <p className="text-amber-600 text-xs mt-1">
              Campos bloqueados para edição manual
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
