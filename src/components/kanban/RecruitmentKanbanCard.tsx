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
  Phone, MoveHorizontal, Calendar,
  AlertTriangle, CheckCircle2, Flame, MessageSquarePlus,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';
import { toast } from 'sonner';
import type { KanbanColumn } from '@/hooks/useKanbanState';

export interface RecruitmentCardLead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  agentId: string;
  columnId: string;
  temperature: string;
  experienceLevel?: string | null;
  lastContactAt?: string | null;
  nextActionText?: string | null;
  nextActionAt?: string | null;
  columnEnteredAt?: string;
  source?: string | null;
  cvUrl?: string | null;
  createdAt?: string;
  candidateProfession?: string | null;
  candidateZone?: string | null;
  candidateMotivation?: string | null;
  candidateNotes?: string | null;
}

interface Props {
  lead: RecruitmentCardLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
  onContactLogged?: (leadId: string, type: string, note: string) => void;
  onQuickNote?: (leadId: string, note: string) => void;
  currentUserId?: string;
}

const expLabels: Record<string, string> = {
  com_experiencia: 'Com Exp.',
  sem_experiencia: 'Sem Exp.',
};

const expColors: Record<string, string> = {
  com_experiencia: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  sem_experiencia: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

const tempBadgeConfig: Record<string, { label: string; emoji: string; colors: string }> = {
  hot:  { label: 'Quente', emoji: '🔥', colors: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  warm: { label: 'Morno',  emoji: '☀️', colors: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  cold: { label: 'Frio',   emoji: '❄️', colors: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

const sourceIconMap: Record<string, string> = {
  instagram: '📸', facebook: '📘', linkedin: '💼', referencia: '👥',
  site: '🌐', olx: '📦', telefone: '📞', evento: '🎤',
};

function getSourceEmoji(source?: string | null): string {
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

export function RecruitmentKanbanCard({
  lead, columns, isDragging, onClick, onMove,
  onContactLogged, onQuickNote, currentUserId,
}: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const [noteOpen, setNoteOpen]   = useState(false);
  const [noteText, setNoteText]   = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState<string>('call');
  const [contactResult, setContactResult] = useState<string>('answered');
  const [contactNote, setContactNote] = useState('');

  const availableColumns = columns.filter(c => c.id !== lead.columnId);
  const aging            = getContactAging(lead.lastContactAt);
  const nextActionInfo   = getNextActionLabel(lead.nextActionAt);
  const shouldShowAgent  = !currentUserId || lead.agentId !== currentUserId;
  const hasNoNextAction  = !lead.nextActionAt;
  const isUrgent         = aging?.urgent ?? false;
  const sourceEmoji      = getSourceEmoji(lead.source);

  // Entrevistado stale alert (>5 days)
  const daysInColumn = lead.columnEnteredAt ? differenceInDays(new Date(), new Date(lead.columnEnteredAt)) : null;
  const interviewStaleAlert = lead.columnId === 'entrevistado' && daysInColumn !== null && daysInColumn > 5;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag], textarea')) return;
    onClick();
  };

  const handleSaveContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resultLabels: Record<string, string> = {
      answered: '✅ Atendeu', no_answer: '📵 Não atendeu', callback: '🔄 Callback agendado',
    };
    const fullNote = [resultLabels[contactResult], contactNote.trim()].filter(Boolean).join(' — ');
    onContactLogged?.(lead.id, contactType, fullNote);
    toast.success(`Contacto registado — ${lead.clientName}`);
    setContactType('call');
    setContactResult('answered');
    setContactNote('');
    setContactOpen(false);
  };

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
          : interviewStaleAlert
            ? 'border-l-orange-400 ring-1 ring-orange-400/20'
            : 'border-l-primary/30',
        isDragging && 'opacity-50',
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-1.5">

        {/* Row 1: Nome + Experiência */}
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-sm truncate flex-1">{lead.clientName}</p>
          {lead.experienceLevel && (
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 shrink-0 border', expColors[lead.experienceLevel] || 'bg-muted text-muted-foreground')}>
              {expLabels[lead.experienceLevel] || 'N/D'}
            </Badge>
          )}
        </div>

        {/* Row 2: Badge Recrutamento + Origem */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            Recrutamento
          </span>
          {lead.source && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {sourceEmoji} {lead.source}
            </span>
          )}
        </div>

        {/* Row 3: Telefone */}
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
        </div>

        {/* Row 4: Aging */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {aging ? (
              <span className={cn('text-[10px] font-medium flex items-center gap-0.5', aging.color)}>
                {aging.urgent && <Flame className="h-3 w-3" />}
                {aging.days}d sem contacto
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Sem contacto registado</span>
            )}
          </div>
          <div className="ml-auto">
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

        {/* Interview stale alert */}
        {interviewStaleAlert && (
          <div className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 dark:bg-orange-900/20 rounded px-2 py-1">
            <AlertTriangle className="h-3 w-3" /> {daysInColumn}d sem decisão
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

            {/* Popover Contactei */}
            <Popover open={contactOpen} onOpenChange={setContactOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10"
                  data-no-drag
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setContactOpen(true); }}
                  title="Registar contacto"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 space-y-2.5"
                align="end"
                data-no-drag
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              >
                <p className="text-xs font-semibold">Registar contacto</p>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Tipo</p>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { value: 'call', label: '📞 Chamada' },
                      { value: 'whatsapp', label: '💬 WhatsApp' },
                      { value: 'email', label: '📧 Email' },
                      { value: 'meeting', label: '🤝 Reunião' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          'px-2 py-1 rounded text-[11px] font-medium border transition-colors',
                          contactType === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                        )}
                        onClick={() => setContactType(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Resultado</p>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { value: 'answered', label: '✅ Atendeu' },
                      { value: 'no_answer', label: '📵 Não atendeu' },
                      { value: 'callback', label: '🔄 Callback' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          'px-2 py-1 rounded text-[11px] font-medium border transition-colors',
                          contactResult === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
                        )}
                        onClick={() => setContactResult(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Nota rápida (opcional)"
                  value={contactNote}
                  onChange={e => setContactNote(e.target.value)}
                  onPointerDown={e => e.stopPropagation()}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline" size="sm" className="h-7 text-xs"
                    onClick={e => { e.stopPropagation(); setContactOpen(false); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm" className="h-7 text-xs gap-1"
                    onClick={handleSaveContact}
                  >
                    <Send className="h-3 w-3" /> Guardar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Nota rápida */}
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
                  placeholder="Escreve uma nota..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onPointerDown={e => e.stopPropagation()}
                  className="text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={e => { e.stopPropagation(); setNoteOpen(false); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSaveNote} disabled={!noteText.trim()}>
                    <Send className="h-3 w-3" /> Guardar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Dropdown Mover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  data-no-drag
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  title="Mover"
                >
                  <MoveHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableColumns.map(c => (
                  <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); onMove(c.id); }}>
                    {c.title}
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
