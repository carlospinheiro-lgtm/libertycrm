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
import {
  Phone, MoveHorizontal, Euro, MapPin,
  Calendar, AlertTriangle, CheckCircle2, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';
import { toast } from 'sonner';
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
  // Extra fields for details sheet
  source?: string;
  typology?: string;
  buyerMotive?: string;
  buyerTimeline?: string;
  buyerFinancing?: string;
  createdAt?: string;
  columnEnteredAt?: string;
}

interface BuyerKanbanCardProps {
  lead: BuyerCardLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
  onContactLogged?: (leadId: string) => void; // ✅ MELHORIA 1: callback para registar contacto
  currentUserId?: string;
}

const temperatureConfig: Record<string, { label: string; className: string }> = {
  hot:       { label: 'Quente',    className: 'bg-destructive text-destructive-foreground' },
  warm:      { label: 'Morno',     className: 'bg-warning text-warning-foreground' },
  cold:      { label: 'Frio',      className: 'bg-info text-info-foreground' },
  undefined: { label: '—',         className: 'bg-muted text-muted-foreground' },
};

function getContactAging(lastContactAt?: string | null): { days: number; color: string; urgent: boolean } | null {
  if (!lastContactAt) return null;
  try {
    const days = differenceInDays(new Date(), new Date(lastContactAt));
    if (days <= 3)  return { days, color: 'text-success',     urgent: false };
    if (days <= 7)  return { days, color: 'text-warning',     urgent: false };
    if (days <= 14) return { days, color: 'text-destructive', urgent: false };
    // ✅ MELHORIA 4: alerta urgente +14 dias
    return { days, color: 'text-destructive', urgent: true };
  } catch {
    return null;
  }
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return '—';
  const fmt = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `${Math.round(v / 1_000)}k`;
    return v.toString();
  };
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}€`;
  if (max != null) return `até ${fmt(max)}€`;
  return `desde ${fmt(min!)}€`;
}

// ✅ MELHORIA 3: label da próxima ação com urgência
function getNextActionLabel(nextActionAt?: string | null): { label: string; urgent: boolean; overdue: boolean } | null {
  if (!nextActionAt) return null;
  try {
    const date = new Date(nextActionAt);
    if (isToday(date))    return { label: 'Hoje',    urgent: true,  overdue: false };
    if (isTomorrow(date)) return { label: 'Amanhã',  urgent: false, overdue: false };
    if (isPast(date))     return { label: 'Atrasada',urgent: true,  overdue: true  };
    return {
      label: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
      urgent: false,
      overdue: false,
    };
  } catch {
    return null;
  }
}

export function BuyerKanbanCard({
  lead, columns, isDragging, onClick, onMove, onContactLogged, currentUserId,
}: BuyerKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const availableColumns    = columns.filter(c => c.id !== lead.columnId);
  const temp                = temperatureConfig[lead.temperature || 'undefined'];
  const aging               = getContactAging(lead.lastContactAt);
  const nextActionInfo      = getNextActionLabel(lead.nextActionAt);
  const shouldShowAgent     = !currentUserId || lead.agentId !== currentUserId;
  const mainZone            = lead.zones?.[0];
  const hasNoNextAction     = !lead.nextActionAt;

  // ✅ MELHORIA 4: borda urgente se +14 dias sem contacto
  const isUrgent = aging?.urgent ?? false;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag]')) return;
    onClick();
  };

  // ✅ MELHORIA 1: registar contacto com 1 clique
  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContactLogged?.(lead.id);
    toast.success(`Contacto registado — ${lead.clientName}`);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'card-interactive bg-card transition-all touch-none border-l-4',
        isUrgent
          ? 'border-l-destructive ring-1 ring-destructive/20'
          : 'border-l-primary/30',
        isDragging && 'opacity-50',
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-1.5">

        {/* Row 1: Name + Temperature */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate flex-1">{lead.clientName}</p>
          <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', temp.className)}>
            {temp.label}
          </Badge>
        </div>

        {/* Row 2: Phone + Budget */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              onClick={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-primary"
            >
              <Phone className="h-3 w-3" />{lead.phone}
            </a>
          ) : (
            <span className="text-muted-foreground/50">Sem telefone</span>
          )}
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
              <span className={cn('text-[10px] font-medium flex items-center gap-0.5', aging.color)}>
                {/* ✅ MELHORIA 4: ícone de chama para urgente */}
                {aging.urgent
                  ? <Flame className="h-3 w-3" />
                  : null
                }
                {aging.days}d
              </span>
            )}
            {hasNoNextAction && (
              <AlertTriangle className="h-3 w-3 text-warning" />
            )}
          </div>
        </div>

        {/* ✅ MELHORIA 2: Próxima ação sempre visível no cartão */}
        {lead.nextActionText ? (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded px-2 py-1',
            nextActionInfo?.overdue
              ? 'bg-destructive/10 text-destructive'
              : nextActionInfo?.urgent
              ? 'bg-warning/10 text-warning-foreground'
              : 'bg-muted/50 text-muted-foreground',
          )}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate flex-1">{lead.nextActionText}</span>
            {nextActionInfo && (
              <span className={cn(
                'ml-auto shrink-0 text-[10px] font-semibold px-1 rounded',
                nextActionInfo.overdue  ? 'bg-destructive/20 text-destructive' :
                nextActionInfo.urgent   ? 'bg-warning/20 text-warning-foreground' :
                'text-muted-foreground',
              )}>
                {nextActionInfo.label}
              </span>
            )}
          </div>
        ) : (
          // Sem próxima ação — aviso discreto
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 rounded px-2 py-1">
            <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
            <span className="italic">Sem próxima ação definida</span>
          </div>
        )}

        {/* Row 5: Agent + ✓ Contactei + Move */}
        <div className="flex items-center justify-between pt-0.5" data-no-drag>
          {shouldShowAgent ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {lead.agentName}
            </span>
          ) : <div />}

          <div className="flex items-center gap-1 ml-auto">
            {/* ✅ MELHORIA 1: Botão ✓ Contactei */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10"
              data-no-drag
              onPointerDown={e => e.stopPropagation()}
              onClick={handleContactClick}
              title="Registar contacto agora"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>

            {/* Mover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  data-no-drag
                  onPointerDown={e => e.stopPropagation()}
                  title="Mover coluna"
                >
                  <MoveHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {availableColumns.map(column => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={e => { e.stopPropagation(); onMove(column.id); }}
                  >
                    {column.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
