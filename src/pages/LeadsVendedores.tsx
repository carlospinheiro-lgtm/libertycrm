import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { SellerKanbanCard, type SellerCardLead } from '@/components/kanban/SellerKanbanCard';
import { SellerDetailsSheet } from '@/components/kanban/SellerDetailsSheet';
import { SellerMetricsDashboard } from '@/components/kanban/SellerMetricsDashboard';
import { MoveLeadDialog } from '@/components/kanban/MoveLeadDialog';
import { AddLeadDialog } from '@/components/kanban/AddLeadDialog';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentFilter } from '@/contexts/AgentFilterContext';
import { useLeadSettings, type LeadMovePopupMode } from '@/hooks/useAgencySettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { LeadsListView } from '@/components/kanban/LeadsListView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { KanbanLead, KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanState';

const sellerColumns: KanbanColumnType[] = [
  { id: 'novo', title: 'Novo', color: 'blue' },
  { id: 'contacto-feito', title: 'Contacto Feito', color: 'cyan' },
  { id: 'avaliacao', title: 'Avaliação / Estudo de Mercado', color: 'cyan' },
  { id: 'apresentacao', title: 'Apresentação de Serviços', color: 'yellow' },
  { id: 'negociacao', title: 'Negociação', color: 'yellow' },
  { id: 'angariacao', title: 'Angariação', color: 'green' },
  { id: 'angariacao-reservada', title: 'Angariação Reservada', color: 'green' },
  { id: 'perdido-followup', title: 'Perdido / Follow-up', color: 'red' },
];

// Auto-tasks when moving to specific columns
async function createAutoTask(leadId: string, agencyId: string, userId: string, columnId: string) {
  const taskMap: Record<string, { title: string; daysOffset: number }> = {
    'avaliacao': { title: 'Preparar CMA', daysOffset: 2 },
    'apresentacao': { title: 'Enviar proposta de serviços', daysOffset: 1 },
    'negociacao': { title: 'Follow-up 3 dias', daysOffset: 3 },
  };
  const task = taskMap[columnId];
  if (!task) return;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + task.daysOffset);

  await supabase.from('lead_tasks').insert({
    lead_id: leadId,
    agency_id: agencyId,
    title: task.title,
    due_date: dueDate.toISOString().split('T')[0],
    assigned_to: userId,
  });
}

async function logStageChange(leadId: string, agencyId: string, userId: string, fromColumn: string, toColumn: string) {
  await supabase.from('seller_interactions').insert({
    lead_id: leadId,
    agency_id: agencyId,
    type: 'stage_change',
    note: `${fromColumn} → ${toColumn}`,
    created_by: userId,
  });
  await supabase.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', leadId);
}

export default function LeadsVendedores() {
  return (
    <DashboardLayout>
      <LeadsVendedoresContent />
    </DashboardLayout>
  );
}

function LeadsVendedoresContent() {
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLead } = useLeads('seller');
  const { currentUser, user } = useAuth();
  const { selectedAgentId } = useAgentFilter();
  const { data: leadSettings } = useLeadSettings(currentUser?.agencyId);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<SellerCardLead | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; targetColumnId: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SellerCardLead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const isDirector = currentUser?.roles?.some(r => ['diretor_geral', 'diretor_comercial', 'diretor_agencia'].includes(r));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const mappedLeads: SellerCardLead[] = leads.map((lead: any) => ({
    id: lead.id,
    clientName: lead.client_name,
    phone: lead.phone || '',
    email: lead.email || '',
    agentName: lead.agent_name || '',
    agentId: lead.user_id,
    columnId: lead.column_id,
    temperature: lead.temperature || 'undefined',
    propertyType: lead.property_type,
    location: lead.location,
    estimatedValue: lead.estimated_value,
    lastContactAt: lead.last_contact_at,
    nextActionText: lead.next_action_text,
    nextActionAt: lead.next_action_at,
    columnEnteredAt: lead.column_entered_at,
    source: lead.source,
    sellerMotivation: lead.seller_motivation,
    sellerDeadline: lead.seller_deadline,
    sellerExclusivity: lead.seller_exclusivity,
    commissionPercentage: lead.commission_percentage,
    contractDuration: lead.contract_duration,
    createdAt: lead.created_at,
  }));

  const filteredLeads = mappedLeads.filter(lead => {
    if (selectedAgentId !== 'all' && lead.agentId !== selectedAgentId) return false;
    return true;
  });

  const shouldShowMovePopup = (targetColumnId: string): boolean => {
    const popupMode: LeadMovePopupMode = leadSettings?.popupMode ?? 'always';
    if (popupMode === 'always') return true;
    if (popupMode === 'never') return false;
    if (popupMode === 'critical') {
      const criticalColumns = leadSettings?.criticalColumns || [];
      return criticalColumns.includes(targetColumnId);
    }
    return true;
  };

  const executeMove = (leadId: string, columnId: string, nextActivityDate?: string, nextActivityDescription?: string) => {
    const lead = mappedLeads.find(l => l.id === leadId);
    const fromTitle = sellerColumns.find(c => c.id === lead?.columnId)?.title || '';
    const toTitle = sellerColumns.find(c => c.id === columnId)?.title || '';

    moveLead.mutate({ id: leadId, column_id: columnId, next_activity_date: nextActivityDate, next_activity_description: nextActivityDescription });

    if (currentUser?.agencyId && user?.id) {
      createAutoTask(leadId, currentUser.agencyId, user.id, columnId);
      logStageChange(leadId, currentUser.agencyId, user.id, fromTitle, toTitle);
    }

    // Prompt for angariação details
    if (columnId === 'angariacao') {
      toast.info('Preencha: Exclusividade, Comissão e Prazo do contrato na ficha', { duration: 6000 });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lead = mappedLeads.find(l => l.id === event.active.id);
    setActiveId(event.active.id as string);
    setDraggedLead(lead || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedLead(null);
    if (over && active.id !== over.id) {
      const lead = mappedLeads.find(l => l.id === active.id);
      const targetColumnId = over.id as string;
      if (lead && sellerColumns.some(c => c.id === targetColumnId) && lead.columnId !== targetColumnId) {
        if (shouldShowMovePopup(targetColumnId)) {
          setPendingMove({ leadId: lead.id, targetColumnId });
          setMoveDialogOpen(true);
        } else {
          executeMove(lead.id, targetColumnId);
        }
      }
    }
  };

  const handleMoveConfirm = (columnId: string, nextActivityDate: string, nextActivityDescription: string) => {
    if (pendingMove) {
      executeMove(pendingMove.leadId, columnId, nextActivityDate, nextActivityDescription);
    }
    setMoveDialogOpen(false);
    setPendingMove(null);
  };

  const handleCardClick = (lead: SellerCardLead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  const handleMoveViaButton = (lead: SellerCardLead, targetColumnId: string) => {
    if (shouldShowMovePopup(targetColumnId)) {
      setPendingMove({ leadId: lead.id, targetColumnId });
      setMoveDialogOpen(true);
    } else {
      executeMove(lead.id, targetColumnId);
    }
  };

  const handleSaveLead = (leadId: string, updates: Record<string, any>) => {
    updateLead.mutate({ id: leadId, ...updates });
  };

  const handleDeleteLead = (leadId: string) => {
    deleteLead.mutate(leadId);
  };

  const handleAddLead = (lead: KanbanLead) => {
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold font-heading">CRM Vendedores</h1>
            <div className="flex items-center gap-3">
              <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v as any)}>
                <ToggleGroupItem value="cards" aria-label="Vista Cartões"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vista Lista"><List className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
              <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Lead
              </Button>
            </div>
          </div>

          {/* Director Metrics */}
          {isDirector && (
            <SellerMetricsDashboard leads={mappedLeads} />
          )}

          {/* Board */}
          {viewMode === 'cards' ? (
            <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll">
              {sellerColumns.map(column => {
                const columnLeads = filteredLeads.filter(l => l.columnId === column.id);
                return (
                  <KanbanColumn key={column.id} id={column.id} title={column.title} color={column.color} count={columnLeads.length} onEditTitle={() => {}} onDelete={() => {}} canDelete={false}>
                    {columnLeads.map(lead => (
                      <SellerKanbanCard
                        key={lead.id}
                        lead={lead}
                        columns={sellerColumns}
                        isDragging={activeId === lead.id}
                        onClick={() => handleCardClick(lead)}
                        onMove={targetId => handleMoveViaButton(lead, targetId)}
                        currentUserId={currentUser?.id}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          ) : (
            <LeadsListView
              leads={filteredLeads as any}
              columns={sellerColumns}
              onLeadClick={(lead: any) => handleCardClick(lead)}
              currentUserId={currentUser?.id}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedLead ? (
            <div className="kanban-card-dragging">
              <SellerKanbanCard lead={draggedLead} columns={sellerColumns} isDragging={false} onClick={() => {}} onMove={() => {}} />
            </div>
          ) : null}
        </DragOverlay>

        {/* Move Dialog */}
        <MoveLeadDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          leadName={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.clientName || '' : ''}
          columns={sellerColumns}
          currentColumnId={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.columnId || '' : ''}
          targetColumnId={pendingMove?.targetColumnId}
          onConfirm={handleMoveConfirm}
          onCancel={() => { setMoveDialogOpen(false); setPendingMove(null); }}
        />

        {/* Details Sheet */}
        <SellerDetailsSheet
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          lead={selectedLead}
          agencyId={currentUser?.agencyId}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />

        {/* Add Lead Dialog */}
        <AddLeadDialog
          open={addLeadOpen}
          onOpenChange={setAddLeadOpen}
          columns={sellerColumns}
          onAdd={handleAddLead}
        />
      </DndContext>
    </>
  );
}
