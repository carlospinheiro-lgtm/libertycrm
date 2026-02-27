import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Phone, MoveHorizontal, Euro, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import type { KanbanColumn } from '@/hooks/useKanbanState';

export interface BuyerCardLead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  agentId?: string;
  columnId: string;
  temperature: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  zones?: string[];
  lastContactAt?: string | null;
  nextActionText?: string | null;
  nextActionAt?: string | null;
}

interface BuyerKanbanCardProps {
  lead: BuyerCardLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
  currentUserId?: string;
}

const temperatureConfig: Record<string, { label: string; className: string }> = {
  hot: { label: 'Quente', className: 'bg-destructive text-destructive-foreground' },
  warm: { label: 'Morno', className: 'bg-warning text-warning-foreground' },
  cold: { label: 'Frio', className: 'bg-info text-info-foreground' },
  undefined: { label: '—', className: 'bg-muted text-muted-foreground' },
};

function getContactAging(lastContactAt?: string | null): { days: number; color: string } | null {
  if (!lastContactAt) return null;
  try {
    const days = differenceInDays(new Date(), new Date(lastContactAt));
    if (days <= 3) return { days, color: 'text-success' };
    if (days <= 7) return { days, color: 'text-warning' };
    return { days, color: 'text-destructive' };
  } catch {
    return null;
  }
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return '—';
  const fmt = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return v.toString();
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}€`;
  if (max != null) return `até ${fmt(max)}€`;
  return `desde ${fmt(min!)}€`;
}

export function BuyerKanbanCard({ lead, columns, isDragging, onClick, onMove, currentUserId }: BuyerKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const availableColumns = columns.filter(c => c.id !== lead.columnId);
  const temp = temperatureConfig[lead.temperature || 'undefined'];
  const aging = getContactAging(lead.lastContactAt);
  const shouldShowAgent = !currentUserId || lead.agentId !== currentUserId;
  const mainZone = lead.zones?.[0];
  const hasNoNextAction = !lead.nextActionAt;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag]')) return;
    onClick();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'card-interactive bg-card transition-all touch-none border-l-4 border-l-primary/30',
        isDragging && 'opacity-50',
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-1.5">
        {/* Row 1: Name + Temperature */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate flex-1">{lead.clientName}</p>
          <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', temp.className)}>{temp.label}</Badge>
        </div>

        {/* Row 2: Phone + Budget */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-primary">
              <Phone className="h-3 w-3" />{lead.phone}
            </a>
          ) : <span className="text-muted-foreground/50">Sem telefone</span>}
          <span className="ml-auto flex items-center gap-0.5">
            <Euro className="h-3 w-3" />
            {formatBudget(lead.budgetMin, lead.budgetMax)}
          </span>
        </div>

        {/* Row 3: Zone + Aging */}
        <div className="flex items-center gap-2 text-xs">
          {mainZone && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />{mainZone}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {aging && (
              <span className={cn('text-[10px] font-medium', aging.color)}>
                {aging.days}d
              </span>
            )}
            {hasNoNextAction && (
              <AlertTriangle className="h-3 w-3 text-warning" />
            )}
          </div>
        </div>

        {/* Row 4: Next action */}
        {lead.nextActionText && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.nextActionText}</span>
            {lead.nextActionAt && (
              <span className="ml-auto shrink-0 text-[10px]">
                {new Date(lead.nextActionAt).toLocaleDateString('pt-PT')}
              </span>
            )}
          </div>
        )}

        {/* Row 5: Agent (if not self) + Move */}
        <div className="flex items-center justify-between pt-1">
          {shouldShowAgent ? (
            <span className="text-[10px] text-muted-foreground truncate">{lead.agentName}</span>
          ) : <div />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" data-no-drag onPointerDown={e => e.stopPropagation()} title="Mover">
                <MoveHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {availableColumns.map(column => (
                <DropdownMenuItem key={column.id} onClick={e => { e.stopPropagation(); onMove(column.id); }}>
                  {column.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
