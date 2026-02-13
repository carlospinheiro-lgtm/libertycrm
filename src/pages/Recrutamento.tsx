import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';
import { useLeads, DbLead } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const recruitmentColumns: Column[] = [
  { id: 'new', title: 'Novo Contacto', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'interview-scheduled', title: 'Entrevista Agendada', color: 'yellow' },
  { id: 'interview-done', title: 'Entrevista Realizada', color: 'yellow' },
  { id: 'decision', title: 'Em Decisão / Proposta', color: 'yellow' },
  { id: 'training', title: 'Em Formação Inicial', color: 'cyan' },
  { id: 'active', title: 'Ativo na Equipa', color: 'green' },
  { id: 'rejected', title: 'Não Avançou', color: 'red' },
];

export default function Recrutamento() {
  const { currentUser } = useAuth();
  // Use 'recruitment' as the lead type - we need to support this in the hook
  const { leads: candidates, isLoading, moveLead } = useLeads('recruitment' as any);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Convert DbLead to Lead format
  const convertedCandidates: Lead[] = candidates.map((candidate: DbLead) => ({
    id: candidate.id,
    clientName: candidate.client_name,
    phone: candidate.phone || '',
    email: candidate.email || '',
    agentName: candidate.agent_name || 'Desconhecido',
    agentId: candidate.user_id,
    agency: candidate.agency_name || 'Desconhecida',
    source: candidate.source || 'Sem Origem',
    entryDate: new Date(candidate.entry_date).toLocaleDateString('pt-PT'),
    columnId: candidate.column_id,
    temperature: (candidate.temperature as any) || 'warm',
    notes: candidate.notes || undefined,
    nextActivityDate: candidate.next_activity_date || undefined,
    nextActivityDescription: candidate.next_activity_description || undefined,
  }));

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <KanbanBoard
          title="Recrutamento de Agentes"
          columns={recruitmentColumns}
          leads={convertedCandidates}
          isRecruitment={true}
          agencyId={currentUser?.agencyId}
          onLeadMoved={(leadId, columnId, nextActivityDate, nextActivityDescription) => {
            moveLead.mutate({ id: leadId, column_id: columnId, next_activity_date: nextActivityDate, next_activity_description: nextActivityDescription });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
