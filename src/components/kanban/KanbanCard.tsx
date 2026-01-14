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
import { Phone, Mail, Calendar, MoveHorizontal, GripVertical, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';

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

const temperatureClasses: Record<string, string> = {
  hot: 'lead-hot',
  warm: 'lead-warm',
  cold: 'lead-cold',
  undefined: 'lead-undefined',
};

export function KanbanCard({ lead, columns, isDragging, onClick, onMove, currentUserId }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const availableColumns = columns.filter(c => c.id !== lead.columnId);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [data-no-drag]')) return;
    onClick();
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('351') ? cleaned : `351${cleaned}`;
  };

  const temp = temperatureConfig[lead.temperature || 'undefined'];
  
  // Only show agent name when viewing leads from other agents
  const shouldShowAgent = !currentUserId || lead.agentId !== currentUserId;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'kanban-card-draggable card-interactive bg-card transition-all touch-none',
        temperatureClasses[lead.temperature || 'undefined'],
        isDragging && 'opacity-50'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Next Activity - Prominent at top */}
        {lead.nextActivityDate && (
          <div className="flex items-center gap-2 bg-warning/20 text-warning-foreground rounded-md px-2 py-1.5 text-xs font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>Próximo: {new Date(lead.nextActivityDate).toLocaleDateString('pt-PT')}</span>
          </div>
        )}

        {/* Header: Name + Temperature Badge */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{lead.clientName}</p>
          </div>

          <Badge className={cn('text-xs font-medium', temp.className)}>
            {temp.label}
          </Badge>
        </div>

        {/* Contact Buttons + Move */}
        <div className="flex items-center gap-1" data-no-drag>
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Ligar"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
            title="Email"
          >
            <Mail className="h-4 w-4" />
          </a>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoveHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {availableColumns.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(column.id);
                  }}
                >
                  Mover para {column.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <Badge variant="outline">{lead.source}</Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{lead.entryDate}</span>
          </div>
        </div>

        {/* Agent - only show when viewing other agents' leads */}
        {shouldShowAgent && (
          <div className="text-xs">
            <span className="text-muted-foreground">Agente: </span>
            <span className="font-medium">{lead.agentName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}