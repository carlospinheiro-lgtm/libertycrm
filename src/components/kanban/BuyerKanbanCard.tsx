import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Phone, MoveHorizontal, Euro, MapPin, Calendar,
  AlertTriangle, CheckCircle2, Flame, MessageSquarePlus,
  Home, ShoppingBag, Users, Send,
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
  source?: string;
  typology?: string;
  buyerMotive?: string;
  buyerTimeline?: string;
  buyerFinancing?: string;
  createdAt?: string;
  columnEnteredAt?: string;
  // ✅ NOVO: tipo de cliente
  clientType?: 'comprador' | 'vendedor' | 'ambos';
}

interface BuyerKanbanCardProps {
  lead: BuyerCardLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
  onContactLogged?: (leadId: string) => void;
  onQuickNote?: (leadId: string, note: string) => void;
  currentUserId?: string;
}

const temperatureConfig: Record<string, { label: string; className: string }> = {
  hot:       { label: 'Quente',    className: 'bg-destructive text-destructive-foreground' },
  warm:      { label: 'Morno',     className: 'bg-warning text-warning-foreground'         },
  cold:      { label: 'Frio',      className: 'bg-info text-info-foreground'               },
  undefined: { label: '—',         className: 'bg-muted text-muted-foreground'             },
};

// ✅ Tipo de cliente — badge + ícone
const clientTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  comprador: { label: 'Comprador', icon: <ShoppingBag className="h-2.5 w-2.5" />, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'     },
  vendedor:  { label: 'Vendedor',  icon: <Home className="h-2.5 w-2.5" />,        className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'  },
  ambos:     { label: 'C + V',     icon: <Users className="h-2.5 w-2.5" />,       className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

// ✅ Ícones de origem
const sourceIconMap: Record<string, string> = {
  instagram: '📸', facebook: '📘', idealista: '🏠', imovirtual: '🔑',
  referencia: '🤝', site: '🌐', remax: '🏷️', telefone: '📞',
};

function getSourceEmoji(source?: string): string {
  if (!source) return '';
  const key = source.toLowerCase();
  for (const [k, v] of Object.entries(sourceIconMap)) {
    if (key.includes(k)) return v;
  }
  return '📋';
}

function getContactAging(lastContactAt?: string | null): { days: number; color: string; urgent: boolean } | null {
  if (!lastContactAt) return null;
  try {
    const days = differenceInDays(new Date(), new Date(lastContactAt));
    if (days <= 3)  return { days, color: 'text-success',     urgent: false };
    if (days <= 7)  return { days, color: 'text-warning',     urgent: false };
    if (days <= 14) return { days, color: 'text-destructive', urgent: false };
    return           { days, color: 'text-destructive',       urgent: true  };
  } catch { return null; }
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

function getNextActionLabel(nextActionAt?: string | null): { label: string; urgent: boolean; overdue: boolean } | null {
  if (!nextActionAt) return null;
  try {
    const date = new Date(nextActionAt);
    if (isToday(date))    return { label: 'Hoje',     urgent: true,  overdue: false };
    if (isTomorrow(date)) return { label: 'Amanhã',   urgent: false, overdue: false };
    if (isPast(date))     return { label: 'Atrasada', urgent: true,  overdue: true  };
    return { label: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }), urgent: false, overdue: false };
  } catch { return null; }
}

export function BuyerKanbanCard({
  lead, columns, isDragging, onClick, onMove,
  onContactLogged, onQuickNote, currentUserId,
}: BuyerKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  // ✅ Estado nota rápida
  const [noteOpen, setNoteOpen]   = useState(false);
  const [noteText, setNoteText]   = useState('');

  const availableColumns = columns.filter(c => c.id !== lead.columnId);
  const temp             = temperatureConfig[lead.temperature || 'undefined'];
  const aging            = getContactAging(lead.lastContactAt);
  const nextActionInfo   = getNextActionLabel(lead.nextActionAt);
  const shouldShowAgent  = !currentUserId || lead.agentId !== currentUserId;
  const mainZone         = lead.zones?.[0];
  const hasNoNextAction  = !lead.nextActionAt;
  const isUrgent         = aging?.urgent ?? false;
  const clientType       = clientTypeConfig[lead.clientType || 'comprador'];
  const sourceEmoji      = getSourceEmoji(lead.source);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag], textarea')) return;
    onClick();
  };

  // ✅ Registar contacto
  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContactLogged?.(lead.id);
    toast.success(`Contacto registado — ${lead.clientName}`);
  };

  // ✅ Guardar nota rápida
  const handleSaveNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!noteText.trim()) return;
    onQuickNote?.(lead.id, noteText.trim());
    toast.success('Nota guardada');
    setNoteText('');
    setNoteOpen(false);
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

        {/* Row 1: Nome + Temperatura */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate flex-1">{lead.clientName}</p>
          <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', temp.className)}>
            {temp.label}
          </Badge>
        </div>

        {/* ✅ Row 2: Tipo de cliente + Origem */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            clientType.className,
          )}>
            {clientType.icon}{clientType.label}
          </span>
          {lead.source && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {sourceEmoji} {lead.source}
            </span>
          )}
        </div>

        {/* Row 3: Telefone + Orçamento */}
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

        {/* Row 4: Zona + Aging */}
        <div className="flex items-center gap-2 text-xs">
          {mainZone && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <MapPin className="h-3 w-3" />{mainZone}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {aging && (
              <span className={cn('text-[10px] font-medium flex items-center gap-0.5', aging.color)}>
                {aging.urgent && <Flame className="h-3 w-3" />}
                {aging.days}d
              </span>
            )}
            {hasNoNextAction && <AlertTriangle className="h-3 w-3 text-warning" />}
          </div>
        </div>

        {/* Row 5: Próxima ação */}
        {lead.nextActionText ? (
          <div className={cn(
            'flex items-center gap-1.5 text-xs rounded px-2 py-1',
            nextActionInfo?.overdue ? 'bg-destructive/10 text-destructive' :
            nextActionInfo?.urgent  ? 'bg-warning/10 text-warning-foreground' :
            'bg-muted/50 text-muted-foreground',
          )}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate flex-1">{lead.nextActionText}</span>
            {nextActionInfo && (
              <span className={cn(
                'ml-auto shrink-0 text-[10px] font-semibold px-1 rounded',
                nextActionInfo.overdue ? 'bg-destructive/20 text-destructive' :
                nextActionInfo.urgent  ? 'bg-warning/20 text-warning-foreground' :
                'text-muted-foreground',
              )}>
                {nextActionInfo.label}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 rounded px-2 py-1">
            <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
            <span className="italic">Sem próxima ação definida</span>
          </div>
        )}

        {/* Row 6: Agente + ações rápidas */}
        <div className="flex items-center justify-between pt-0.5" data-no-drag>
          {shouldShowAgent ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
              {lead.agentName}
            </span>
          ) : <div />}

          <div className="flex items-center gap-1 ml-auto">

            {/* ✅ Botão ✓ Contactei */}
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10"
              data-no-drag
              onPointerDown={e => e.stopPropagation()}
              onClick={handleContactClick}
              title="Registar contacto"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>

            {/* ✅ Nota rápida */}
            <Popover open={noteOpen} onOpenChange={setNoteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  data-no-drag
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setNoteOpen(true); }}
                  title="Nota rápida"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-3 space-y-2"
                align="end"
                data-no-drag
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <p className="text-xs font-semibold">Nota rápida — {lead.clientName}</p>
                <Textarea
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Escreve uma nota..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onPointerDown={e => e.stopPropagation()}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline" size="sm" className="h-7 text-xs"
                    onClick={e => { e.stopPropagation(); setNoteOpen(false); setNoteText(''); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm" className="h-7 text-xs gap-1"
                    onClick={handleSaveNote}
                    disabled={!noteText.trim()}
                  >
                    <Send className="h-3 w-3" /> Guardar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Mover coluna */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6"
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
