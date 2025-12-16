import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Phone, Mail, Calendar, Building2, MoveHorizontal, Flame, Sun, Snowflake, Circle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';

interface KanbanCardProps {
  lead: KanbanLead;
  columns: KanbanColumn[];
  isDragging: boolean;
  onClick: () => void;
  onMove: (targetColumnId: string) => void;
}

const temperatureIcons: Record<string, React.ReactNode> = {
  hot: <Flame className="h-3 w-3 text-destructive" />,
  warm: <Sun className="h-3 w-3 text-warning" />,
  cold: <Snowflake className="h-3 w-3 text-info" />,
  undefined: <Circle className="h-3 w-3 text-muted-foreground" />,
};

const temperatureClasses: Record<string, string> = {
  hot: 'lead-hot',
  warm: 'lead-warm',
  cold: 'lead-cold',
  undefined: 'lead-undefined',
};

export function KanbanCard({ lead, columns, isDragging, onClick, onMove }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const initials = lead.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const availableColumns = columns.filter(c => c.id !== lead.columnId);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open details if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    onClick();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer card-interactive bg-card transition-all',
        temperatureClasses[lead.temperature || 'undefined'],
        isDragging && 'opacity-50'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Drag Handle + Client */}
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{lead.clientName}</p>
              {temperatureIcons[lead.temperature || 'undefined']}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{lead.agency}</span>
            </div>
          </div>

          {/* Move Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
        <div className="space-y-1.5 text-xs text-muted-foreground">
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
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Badge variant="outline" className="text-xs">
            {lead.source}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{lead.entryDate}</span>
          </div>
        </div>

        {/* Agent */}
        <div className="text-xs">
          <span className="text-muted-foreground">Agente: </span>
          <span className="font-medium">{lead.agentName}</span>
        </div>

        {/* Next Activity */}
        {lead.nextActivityDate && (
          <div className="text-xs bg-muted/50 rounded p-2">
            <span className="text-muted-foreground">Próxima: </span>
            <span className="font-medium">
              {new Date(lead.nextActivityDate).toLocaleDateString('pt-PT')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
