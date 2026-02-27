import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { KanbanLead } from '@/hooks/useKanbanState';

const buyerColumns: Column[] = [
  { id: 'new', title: 'Novo Contacto', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'qualifying', title: 'Em Qualificação', color: 'cyan' },
  { id: 'visits', title: 'Visitas Agendadas', color: 'yellow' },
  { id: 'proposal', title: 'Proposta Apresentada', color: 'yellow' },
  { id: 'negotiation', title: 'Em Negociação', color: 'yellow' },
  { id: 'won', title: 'Fechado - Ganhámos', color: 'green' },
  { id: 'lost', title: 'Fechado - Perdemos', color: 'red' },
];

export default function LeadsCompradores() {
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLead } = useLeads('buyer');
  const { currentUser } = useAuth();

  const mappedLeads: Lead[] = leads.map((lead: any) => ({
    id: lead.id,
    clientName: lead.client_name,
    phone: lead.phone || '',
    email: lead.email || '',
    agentName: lead.agent_name || '',
    agentId: lead.user_id,
    agency: lead.agency_name || '',
    source: lead.source || '',
    entryDate: new Date(lead.entry_date).toLocaleDateString('pt-PT'),
    notes: lead.notes || undefined,
    columnId: lead.column_id,
    temperature: (lead.temperature as Lead['temperature']) || 'undefined',
    nextActivityDate: lead.next_activity_date || undefined,
    nextActivityDescription: lead.next_activity_description || undefined,
    budgetMin: lead.budget_min,
    budgetMax: lead.budget_max,
    priority: lead.priority || 'normal',
    columnEnteredAt: lead.column_entered_at,
  }));

  // Map kanban IDs to DB IDs (they're the same since we use DB ids)
  const dbLeadIds: Record<string, string> = {};
  leads.forEach(lead => { dbLeadIds[lead.id] = lead.id; });

  const handleLeadMoved = (leadId: string, columnId: string, nextActivityDate?: string, nextActivityDescription?: string) => {
    moveLead.mutate({ id: leadId, column_id: columnId, next_activity_date: nextActivityDate, next_activity_description: nextActivityDescription });
  };

  const handleLeadUpdated = (leadId: string, updates: Partial<KanbanLead>) => {
    updateLead.mutate({
      id: leadId,
      ...(updates.clientName !== undefined && { client_name: updates.clientName }),
      ...(updates.phone !== undefined && { phone: updates.phone }),
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.temperature !== undefined && { temperature: updates.temperature }),
      ...(updates.columnId !== undefined && { column_id: updates.columnId }),
    });
  };

  const handleLeadAdded = (lead: KanbanLead) => {
    if (!currentUser?.agencyId) return;
    addLead.mutate({
      client_name: lead.clientName,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      source: lead.source || undefined,
      column_id: lead.columnId,
      temperature: lead.temperature,
      notes: lead.notes || undefined,
      agency_id: currentUser.agencyId,
    });
  };

  const handleLeadDeleted = (leadId: string) => {
    deleteLead.mutate(leadId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <KanbanBoard
          title="Leads Compradores"
          columns={buyerColumns}
          leads={mappedLeads}
          agencyId={currentUser?.agencyId}
          onLeadMoved={handleLeadMoved}
          onLeadUpdated={handleLeadUpdated}
          onLeadAdded={handleLeadAdded}
          onLeadDeleted={handleLeadDeleted}
          dbLeadIds={dbLeadIds}
        />
      </div>
    </DashboardLayout>
  );
}
