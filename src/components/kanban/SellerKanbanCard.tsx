import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Phone, AlertTriangle, Calendar, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { KanbanColumn } from '@/hooks/useKanbanState';

export interface SellerCardLead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  agentId: string;
  columnId: string;
  temperature: string;
  propertyType?: string | null;
  location?: string | null;
  estimatedValue?: number | null;
  lastContactAt?: string | null;
  nextActionText?: string | null;
  nextActionAt?: string | null;
  columnEnteredAt?: string;
  source?: string | null;
  sellerMotivation?: string | null;
  sellerDeadline?: string | null;
  sellerExclusivity?: string | null;
  commissionPercentage?: number | null;
  contractDuration?: string | null;
  createdAt?: string;
}

interface Props {
  lead: SellerCardLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
  onContactLogged?: (leadId: string, type: string, note: string) => void;
  currentUserId?: string;
}

function getDaysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getContactColor(days: number | null): string {
  if (days === null) return 'text-muted-foreground';
  if (days <= 3) return 'text-green-600';
  if (days <= 7) return 'text-orange-500';
  return 'text-red-600';
}

const tempColors: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-sky-100 text-sky-700 border-sky-200',
  undefined: 'bg-muted text-muted-foreground border-border',
};

const tempLabels: Record<string, string> = {
  hot: 'Quente',
  warm: 'Morno',
  cold: 'Frio',
  undefined: 'N/D',
};

const contactTypes = [
  { value: 'call', label: 'Chamada' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'Visita' },
];

const contactResults = [
  { value: 'answered', label: 'Atendeu' },
  { value: 'no_answer', label: 'Não atendeu' },
  { value: 'callback', label: 'Callback' },
];

export function SellerKanbanCard({ lead, columns, isDragging, onClick, onMove, onContactLogged, currentUserId }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState('call');
  const [contactResult, setContactResult] = useState('answered');
  const [contactNote, setContactNote] = useState('');

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const daysSinceContact = getDaysSince(lead.lastContactAt);
  const contactColor = getContactColor(daysSinceContact);
  const showAgentName = currentUserId !== lead.agentId;

  const daysInColumn = getDaysSince(lead.columnEnteredAt);
  const evaluationAlert = lead.columnId === 'avaliacao' && daysInColumn !== null && daysInColumn > 5;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="menu"]')) return;
    onClick();
  };

  const handleSaveContact = () => {
    if (!onContactLogged) return;
    const resultLabel = contactResults.find(r => r.value === contactResult)?.label || '';
    const fullNote = [resultLabel, contactNote].filter(Boolean).join(' — ');
    onContactLogged(lead.id, contactType, fullNote);
    toast.success('Contacto registado');
    setContactOpen(false);
    setContactNote('');
    setContactType('call');
    setContactResult('answered');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border bg-card p-3 space-y-2 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${isDragging ? 'opacity-50' : ''} ${evaluationAlert ? 'border-orange-400' : ''}`}
      onClick={handleCardClick}
    >
      {/* Name + temp */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm truncate">{lead.clientName}</span>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${tempColors[lead.temperature] || tempColors.undefined}`}>
          {tempLabels[lead.temperature] || 'N/D'}
        </Badge>
      </div>

      {/* Phone */}
      {lead.phone && (
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={e => e.stopPropagation()}>
          <Phone className="h-3 w-3" /> {lead.phone}
        </a>
      )}

      {/* Property type + value */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {lead.propertyType && <span className="capitalize">{lead.propertyType}</span>}
        {lead.estimatedValue && (
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.estimatedValue)}
          </span>
        )}
      </div>

      {/* Last contact */}
      <div className={`text-xs ${contactColor}`}>
        {daysSinceContact !== null ? `Último contacto: ${daysSinceContact}d` : 'Sem contacto registado'}
      </div>

      {/* Next action */}
      {lead.nextActionText ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="truncate">{lead.nextActionText}</span>
          {lead.nextActionAt && <span className="shrink-0">({new Date(lead.nextActionAt).toLocaleDateString('pt-PT')})</span>}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-orange-500">
          <AlertTriangle className="h-3 w-3" /> Sem próxima ação
        </div>
      )}

      {/* Evaluation stale alert */}
      {evaluationAlert && (
        <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
          <AlertTriangle className="h-3 w-3" /> {daysInColumn}d em Avaliação
        </div>
      )}

      {/* Agent name (director view) */}
      {showAgentName && lead.agentName && (
        <div className="text-[10px] text-muted-foreground">Agente: {lead.agentName}</div>
      )}

      {/* Actions: Contact + Move */}
      <div className="pt-1 flex gap-1">
        {/* Contact popover */}
        {onContactLogged && (
          <Popover open={contactOpen} onOpenChange={setContactOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 flex-1 text-xs gap-1" onClick={e => e.stopPropagation()}>
                <CheckCircle2 className="h-3 w-3" /> Contactei
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="start" onClick={e => e.stopPropagation()}>
              <p className="text-xs font-medium">Registar contacto</p>
              {/* Type */}
              <div className="flex flex-wrap gap-1">
                {contactTypes.map(t => (
                  <Button
                    key={t.value}
                    variant={contactType === t.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setContactType(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              {/* Result */}
              <div className="flex flex-wrap gap-1">
                {contactResults.map(r => (
                  <Button
                    key={r.value}
                    variant={contactResult === r.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setContactResult(r.value)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              {/* Note */}
              <input
                className="w-full border rounded px-2 py-1 text-xs bg-background"
                placeholder="Nota rápida..."
                value={contactNote}
                onChange={e => setContactNote(e.target.value)}
              />
              <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={handleSaveContact}>
                <Send className="h-3 w-3" /> Guardar
              </Button>
            </PopoverContent>
          </Popover>
        )}

        {/* Quick move */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-6 text-xs gap-1", onContactLogged ? "flex-1" : "w-full")} onClick={e => e.stopPropagation()}>
              <ArrowRight className="h-3 w-3" /> Mover
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {columns.filter(c => c.id !== lead.columnId).map(c => (
              <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); onMove(c.id); }}>
                {c.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
