import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageCircle, Calendar } from 'lucide-react';
import type { KanbanLead, KanbanColumn } from '@/hooks/useKanbanState';
import { cn } from '@/lib/utils';

interface LeadsListViewProps {
  leads: KanbanLead[];
  columns: KanbanColumn[];
  onLeadClick: (lead: KanbanLead) => void;
  currentUserId?: string;
}

const temperatureConfig: Record<string, { label: string; className: string }> = {
  hot: { label: 'Quente', className: 'bg-destructive text-destructive-foreground' },
  warm: { label: 'Morno', className: 'bg-warning text-warning-foreground' },
  cold: { label: 'Frio', className: 'bg-info text-info-foreground' },
  undefined: { label: 'Indefinido', className: 'bg-muted text-muted-foreground' },
};

export function LeadsListView({ leads, columns, onLeadClick, currentUserId }: LeadsListViewProps) {
  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('351') ? cleaned : `351${cleaned}`;
  };

  const getColumnName = (columnId: string) => {
    return columns.find(c => c.id === columnId)?.title || columnId;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Agente</TableHead>
            <TableHead>Coluna</TableHead>
            <TableHead>Temperatura</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Próx. Atividade</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhuma lead encontrada
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => {
              const temp = temperatureConfig[lead.temperature || 'undefined'];
              const shouldShowAgent = !currentUserId || lead.agentId !== currentUserId;
              
              return (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onLeadClick(lead)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.clientName}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Ligar"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                        title="Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {shouldShowAgent ? (
                      <span>{lead.agentName}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Você</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getColumnName(lead.columnId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', temp.className)}>
                      {temp.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {lead.nextActivityDate ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(lead.nextActivityDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
