import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, Calendar, Building2 } from 'lucide-react';
import type { Lead } from './KanbanBoard';

interface KanbanCardProps {
  lead: Lead;
}

export function KanbanCard({ lead }: KanbanCardProps) {
  const initials = lead.clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="cursor-pointer card-interactive bg-card">
      <CardContent className="p-4 space-y-3">
        {/* Client */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{lead.clientName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{lead.agency}</span>
            </div>
          </div>
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
      </CardContent>
    </Card>
  );
}
