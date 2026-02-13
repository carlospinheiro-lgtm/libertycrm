import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';
import { LeadsExcelDialog } from '@/components/kanban/LeadsExcelDialog';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { KanbanLead } from '@/hooks/useKanbanState';

const sellerColumns: Column[] = [
  { id: 'new', title: 'Novo Proprietário', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'meeting', title: 'Reunião Captação', color: 'cyan' },
  { id: 'evaluation', title: 'Em Avaliação', color: 'yellow' },
  { id: 'proposal-sent', title: 'Proposta Enviada', color: 'yellow' },
  { id: 'decision', title: 'Em Decisão', color: 'yellow' },
  { id: 'signed', title: 'Angariação Assinada', color: 'green' },
  { id: 'lost', title: 'Perdido', color: 'red' },
];

export default function LeadsVendedores() {
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLead } = useLeads('seller');
  const { currentUser } = useAuth();
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);

  const mappedLeads: Lead[] = leads.map((lead) => ({
    id: lead.id,
    clientName: lead.client_name,
    phone: lead.phone || '',
    email: lead.email || '',
    agentName: lead.agent_name || '',
    agency: lead.agency_name || '',
    source: lead.source || '',
    entryDate: new Date(lead.entry_date).toLocaleDateString('pt-PT'),
    notes: lead.notes || undefined,
    columnId: lead.column_id,
    temperature: (lead.temperature as Lead['temperature']) || 'undefined',
    nextActivityDate: lead.next_activity_date || undefined,
    nextActivityDescription: lead.next_activity_description || undefined,
  }));

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
          title="Leads Vendedores"
          columns={sellerColumns}
          leads={mappedLeads}
          onExcelClick={() => setExcelDialogOpen(true)}
          onLeadMoved={handleLeadMoved}
          onLeadUpdated={handleLeadUpdated}
          onLeadAdded={handleLeadAdded}
          onLeadDeleted={handleLeadDeleted}
        />
      </div>

      <LeadsExcelDialog
        open={excelDialogOpen}
        onOpenChange={setExcelDialogOpen}
        leads={mappedLeads}
        columns={sellerColumns}
        agencyId={currentUser?.agencyId}
        leadType="seller"
      />
    </DashboardLayout>
  );
}
