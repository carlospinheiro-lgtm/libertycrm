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
import { Phone, Mail, Calendar, MoveHorizontal, MessageCircle, Euro, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';
import { differenceInDays } from 'date-fns';

const proposalStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Enviada', className: 'bg-info/20 text-info' },
  analysis: { label: 'Em Análise', className: 'bg-warning/20 text-warning' },
  accepted: { label: 'Aceite', className: 'bg-success/20 text-success' },
  rejected: { label: 'Recusada', className: 'bg-destructive/20 text-destructive' },
  counter: { label: 'Contra-Proposta', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

interface KanbanCardProps {
  lead: KanbanLead;
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
  undefined: { label: 'Indefinido', className: 'bg-muted text-muted-foreground' },
};

const priorityBorderColors: Record<string, string> = {
  low: 'border-l-muted-foreground/40',
  normal: 'border-l-info',
  high: 'border-l-destructive',
  urgent: 'border-l-foreground',
};

function getAgingInfo(entryDate: string, columnEnteredAt?: string) {
  const refDate = columnEnteredAt || entryDate;
  try {
    const days = differenceInDays(new Date(), new Date(refDate));
    if (days < 7) return { days, color: 'bg-success/20 text-success' };
    if (days < 14) return { days, color: 'bg-warning/20 text-warning' };
    return { days, color: 'bg-destructive/20 text-destructive' };
  } catch {
    return { days: 0, color: 'bg-muted text-muted-foreground' };
  }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const initialsColors = [
  'bg-primary text-primary-foreground',
  'bg-info text-info-foreground',
  'bg-success text-success-foreground',
  'bg-warning text-warning-foreground',
  'bg-accent text-accent-foreground',
];

function getInitialsColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return initialsColors[Math.abs(hash) % initialsColors.length];
}

export function KanbanCard({ lead, columns, isDragging, onClick, onMove, currentUserId }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const availableColumns = columns.filter(c => c.id !== lead.columnId);
  const temp = temperatureConfig[lead.temperature || 'undefined'];
  const priority = (lead as any).priority || 'normal';
  const budgetMin = (lead as any).budgetMin;
  const budgetMax = (lead as any).budgetMax;
  const columnEnteredAt = (lead as any).columnEnteredAt;
  const proposalStatus = (lead as any).proposalStatus as string | undefined;
  const aging = getAgingInfo(lead.entryDate, columnEnteredAt);
  const shouldShowAgent = !currentUserId || lead.agentId !== currentUserId;
  const isInProposalColumn = lead.columnId === 'proposal';

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag]')) return;
    onClick();
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('351') ? cleaned : `351${cleaned}`;
  };

  const formatBudget = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return v.toString();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'kanban-card-draggable card-interactive bg-card transition-all touch-none border-l-4',
        priorityBorderColors[priority] || 'border-l-info',
        isDragging && 'opacity-50',
        isInProposalColumn && !proposalStatus && 'ring-2 ring-warning animate-pulse'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Avatar + Name + Temp badge + Aging */}
        <div className="flex items-center gap-2">
          <div className={cn('flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold', getInitialsColor(lead.clientName))}>
            {getInitials(lead.clientName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{lead.clientName}</p>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} className="text-xs text-muted-foreground hover:text-primary">
                {lead.phone}
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn('text-[10px] px-1.5 py-0', temp.className)}>{temp.label}</Badge>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', aging.color)}>
              {aging.days}d
            </Badge>
          </div>
        </div>

        {/* Source + Budget */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.source && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{lead.source}</Badge>
          )}
          {budgetMin != null && budgetMax != null && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Euro className="h-2.5 w-2.5" />
              {formatBudget(budgetMin)} – {formatBudget(budgetMax)}
            </Badge>
          )}
        </div>

        {/* Proposal Status Badge */}
        {proposalStatus && proposalStatusConfig[proposalStatus] && (
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <Badge className={cn('text-[10px] px-1.5 py-0', proposalStatusConfig[proposalStatus].className)}>
              {proposalStatusConfig[proposalStatus].label}
            </Badge>
          </div>
        )}

        {lead.nextActivityDate && (
          <div className="flex items-center gap-1.5 bg-warning/10 rounded px-2 py-1 text-xs text-warning-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(lead.nextActivityDate).toLocaleDateString('pt-PT')}</span>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex items-center gap-1" data-no-drag>
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}
            className="inline-flex items-center justify-center h-7 w-7 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Ligar">
            <Phone className="h-3.5 w-3.5" />
          </a>
          <a href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}
            className="inline-flex items-center justify-center h-7 w-7 rounded bg-success/10 text-success hover:bg-success/20 transition-colors" title="WhatsApp">
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}
            className="inline-flex items-center justify-center h-7 w-7 rounded bg-info/10 text-info hover:bg-info/20 transition-colors" title="Email">
            <Mail className="h-3.5 w-3.5" />
          </a>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onPointerDown={e => e.stopPropagation()}>
                <MoveHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {availableColumns.map(column => (
                <DropdownMenuItem key={column.id} onClick={e => { e.stopPropagation(); onMove(column.id); }}>
                  Mover para {column.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Agent */}
        {shouldShowAgent && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-border text-xs text-muted-foreground">
            <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold', getInitialsColor(lead.agentName))}>
              {getInitials(lead.agentName)}
            </div>
            <span className="truncate">{lead.agentName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
