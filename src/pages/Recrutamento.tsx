import { useState, useMemo } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { RecruitmentKanbanCard, type RecruitmentCardLead } from '@/components/kanban/RecruitmentKanbanCard';
import { RecruitmentDetailsSheet } from '@/components/kanban/RecruitmentDetailsSheet';
import { RecruitmentMetricsDashboard } from '@/components/kanban/RecruitmentMetricsDashboard';
import { MoveLeadDialog } from '@/components/kanban/MoveLeadDialog';
import { AddLeadDialog } from '@/components/kanban/AddLeadDialog';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentFilter } from '@/contexts/AgentFilterContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, LayoutGrid, List, Search, CalendarClock } from 'lucide-react';
import { LeadsListView } from '@/components/kanban/LeadsListView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { KanbanLead, KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanState';

const recruitmentColumns: KanbanColumnType[] = [
  { id: 'novo-lead', title: 'Novo Lead', color: 'blue' },
  { id: 'contactado', title: 'Contactado', color: 'cyan' },
  { id: 'entrevista-agendada', title: 'Entrevista Agendada', color: 'yellow' },
  { id: 'entrevistado', title: 'Entrevistado', color: 'yellow' },
  { id: 'em-decisao', title: 'Em Decisão', color: 'yellow' },
  { id: 'integrado', title: 'Integrado', color: 'green' },
  { id: 'nao-avancou', title: 'Não Avançou', color: 'red' },
];

async function createAutoTask(leadId: string, agencyId: string, userId: string, columnId: string) {
  const taskMap: Record<string, { title: string; daysOffset: number }> = {
    'contactado': { title: 'Agendar entrevista', daysOffset: 2 },
    'entrevista-agendada': { title: 'Lembrete entrevista', daysOffset: 1 },
    'entrevistado': { title: 'Follow-up decisão', daysOffset: 3 },
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
  await supabase.from('recruitment_interactions').insert({
    lead_id: leadId,
    agency_id: agencyId,
    type: 'stage_change',
    note: `${fromColumn} → ${toColumn}`,
    created_by: userId,
  });
  await supabase.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', leadId);
}

export default function Recrutamento() {
  return (
    <DashboardLayout>
      <RecrutamentoContent />
    </DashboardLayout>
  );
}

function RecrutamentoContent() {
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLead } = useLeads('recruitment');
  const { currentUser, user } = useAuth();
  const { selectedAgentId } = useAgentFilter();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<RecruitmentCardLead | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; targetColumnId: string } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<RecruitmentCardLead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [expFilter, setExpFilter] = useState<'all' | 'com_experiencia' | 'sem_experiencia'>('all');
  const [todayView, setTodayView] = useState(false);

  const isDirector = currentUser?.roles?.some(r => ['diretor_geral', 'diretor_comercial', 'diretor_agencia', 'diretor_rh'].includes(r));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const mappedLeads: RecruitmentCardLead[] = leads.map((lead: any) => ({
    id: lead.id,
    clientName: lead.client_name,
    phone: lead.phone || '',
    email: lead.email || '',
    agentName: lead.agent_name || '',
    agentId: lead.user_id,
    columnId: lead.column_id,
    temperature: lead.temperature || 'warm',
    experienceLevel: lead.experience_level,
    lastContactAt: lead.last_contact_at,
    nextActionText: lead.next_action_text,
    nextActionAt: lead.next_action_at,
    columnEnteredAt: lead.column_entered_at,
    source: lead.source,
    cvUrl: lead.cv_url,
    createdAt: lead.created_at,
  }));

  // Apply filters
  const filteredLeads = useMemo(() => {
    let result = mappedLeads;

    // Agent filter
    if (selectedAgentId !== 'all') {
      result = result.filter(l => l.agentId === selectedAgentId);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.clientName.toLowerCase().includes(term) ||
        l.phone.toLowerCase().includes(term)
      );
    }

    // Experience filter
    if (expFilter !== 'all') {
      result = result.filter(l => l.experienceLevel === expFilter);
    }

    // Today view
    if (todayView) {
      result = result.filter(l => {
        if (!l.nextActionAt) return false;
        try { return isToday(new Date(l.nextActionAt)); } catch { return false; }
      });
    }

    return result;
  }, [mappedLeads, selectedAgentId, searchTerm, expFilter, todayView]);

  // Counters for experience filter
  const expCounts = useMemo(() => {
    const agentFiltered = selectedAgentId !== 'all'
      ? mappedLeads.filter(l => l.agentId === selectedAgentId)
      : mappedLeads;
    return {
      all: agentFiltered.length,
      com_experiencia: agentFiltered.filter(l => l.experienceLevel === 'com_experiencia').length,
      sem_experiencia: agentFiltered.filter(l => l.experienceLevel === 'sem_experiencia').length,
    };
  }, [mappedLeads, selectedAgentId]);

  // Move popup always disabled
  const shouldShowMovePopup = (_targetColumnId: string): boolean => {
    return false;
  };

  const executeMove = (leadId: string, columnId: string, nextActivityDate?: string, nextActivityDescription?: string) => {
    const lead = mappedLeads.find(l => l.id === leadId);
    const fromTitle = recruitmentColumns.find(c => c.id === lead?.columnId)?.title || '';
    const toTitle = recruitmentColumns.find(c => c.id === columnId)?.title || '';

    moveLead.mutate({ id: leadId, column_id: columnId, next_activity_date: nextActivityDate, next_activity_description: nextActivityDescription });

    if (currentUser?.agencyId && user?.id) {
      createAutoTask(leadId, currentUser.agencyId, user.id, columnId);
      logStageChange(leadId, currentUser.agencyId, user.id, fromTitle, toTitle);
    }

    // Special toasts
    if (columnId === 'integrado') {
      toast.success('🎉 Parabéns! Novo consultor integrado. Não esqueças de criar o perfil de utilizador.');
    } else if (columnId === 'nao-avancou') {
      toast.info('📋 Candidato arquivado. Define um follow-up para reativar no futuro.');
    } else {
      toast.success(`Lead movida para ${toTitle}`);
    }
  };

  // Callbacks for card actions
  const handleContactLogged = async (leadId: string, type: string, note: string) => {
    if (!currentUser?.agencyId || !user?.id) return;
    await supabase.from('recruitment_interactions').insert({
      lead_id: leadId,
      agency_id: currentUser.agencyId,
      type,
      note,
      created_by: user.id,
    });
    await supabase.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', leadId);
  };

  const handleQuickNote = async (leadId: string, note: string) => {
    if (!currentUser?.agencyId || !user?.id) return;
    await supabase.from('recruitment_interactions').insert({
      lead_id: leadId,
      agency_id: currentUser.agencyId,
      type: 'note',
      note,
      created_by: user.id,
    });
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
      if (lead && recruitmentColumns.some(c => c.id === targetColumnId) && lead.columnId !== targetColumnId) {
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

  const handleCardClick = (lead: RecruitmentCardLead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  };

  const handleMoveViaButton = (lead: RecruitmentCardLead, targetColumnId: string) => {
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
            <h1 className="text-2xl font-bold font-heading">CRM Recrutamento</h1>
            <div className="flex items-center gap-3">
              <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v as any)}>
                <ToggleGroupItem value="cards" aria-label="Vista Cartões"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vista Lista"><List className="h-4 w-4" /></ToggleGroupItem>
              </ToggleGroup>
              <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Novo Candidato
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar nome ou telefone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Experience filter buttons */}
            <div className="flex items-center gap-1.5">
              {([
                { value: 'all' as const, label: 'Todos' },
                { value: 'com_experiencia' as const, label: 'Com Exp.' },
                { value: 'sem_experiencia' as const, label: 'Sem Exp.' },
              ]).map(opt => (
                <Button
                  key={opt.value}
                  variant={expFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => setExpFilter(opt.value)}
                >
                  {opt.label}
                  <span className={cn(
                    'ml-0.5 text-[10px] px-1 rounded-full',
                    expFilter === opt.value ? 'bg-primary-foreground/20' : 'bg-muted',
                  )}>
                    {expCounts[opt.value]}
                  </span>
                </Button>
              ))}
            </div>

            {/* Today view toggle */}
            <Button
              variant={todayView ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setTodayView(!todayView)}
            >
              <CalendarClock className="h-3.5 w-3.5" /> Hoje
            </Button>
          </div>

          {/* Director Metrics */}
          {isDirector && (
            <RecruitmentMetricsDashboard leads={mappedLeads} />
          )}

          {/* Board */}
          {viewMode === 'cards' ? (
            <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll">
              {recruitmentColumns.map(column => {
                const columnLeads = filteredLeads.filter(l => l.columnId === column.id);
                return (
                  <KanbanColumn key={column.id} id={column.id} title={column.title} color={column.color} count={columnLeads.length} onEditTitle={() => {}} onDelete={() => {}} canDelete={false}>
                    {columnLeads.map(lead => (
                      <RecruitmentKanbanCard
                        key={lead.id}
                        lead={lead}
                        columns={recruitmentColumns}
                        isDragging={activeId === lead.id}
                        onClick={() => handleCardClick(lead)}
                        onMove={targetId => handleMoveViaButton(lead, targetId)}
                        onContactLogged={handleContactLogged}
                        onQuickNote={handleQuickNote}
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
              columns={recruitmentColumns}
              onLeadClick={(lead: any) => handleCardClick(lead)}
              currentUserId={currentUser?.id}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedLead ? (
            <div className="kanban-card-dragging">
              <RecruitmentKanbanCard lead={draggedLead} columns={recruitmentColumns} isDragging={false} onClick={() => {}} onMove={() => {}} />
            </div>
          ) : null}
        </DragOverlay>

        {/* Move Dialog */}
        <MoveLeadDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          leadName={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.clientName || '' : ''}
          columns={recruitmentColumns}
          currentColumnId={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.columnId || '' : ''}
          targetColumnId={pendingMove?.targetColumnId}
          onConfirm={handleMoveConfirm}
          onCancel={() => { setMoveDialogOpen(false); setPendingMove(null); }}
        />

        {/* Details Sheet */}
        <RecruitmentDetailsSheet
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
          columns={recruitmentColumns}
          onAdd={handleAddLead}
        />
      </DndContext>
    </>
  );
}
