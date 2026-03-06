import { useState, useMemo } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { BuyerKanbanCard, type BuyerCardLead } from '@/components/kanban/BuyerKanbanCard';
import { BuyerDetailsSheet } from '@/components/kanban/BuyerDetailsSheet';
import { BuyerMetricsDashboard } from '@/components/kanban/BuyerMetricsDashboard';
import { MoveLeadDialog } from '@/components/kanban/MoveLeadDialog';
import { AddLeadDialog } from '@/components/kanban/AddLeadDialog';
import { useLeads } from '@/hooks/useLeads';
import { useBuyerInteractions } from '@/hooks/useBuyerInteractions';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentFilter } from '@/contexts/AgentFilterContext';
import { useLeadSettings, type LeadMovePopupMode } from '@/hooks/useAgencySettings';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Plus, LayoutGrid, List, Search, Sun,
  Flame, Thermometer, Snowflake, X,
} from 'lucide-react';
import { LeadsListView } from '@/components/kanban/LeadsListView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isToday } from 'date-fns';
import type { KanbanLead, KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanState';

const buyerColumns: KanbanColumnType[] = [
  { id: 'novo',                 title: 'Novo',                    color: 'blue'   },
  { id: 'contacto-feito',       title: 'Contacto Feito',          color: 'cyan'   },
  { id: 'qualificacao',         title: 'Qualificação',            color: 'cyan'   },
  { id: 'ativo',                title: 'Ativo (Imóveis enviados)', color: 'yellow' },
  { id: 'visitas',              title: 'Visitas',                  color: 'yellow' },
  { id: 'proposta-negociacao',  title: 'Proposta / Negociação',   color: 'yellow' },
  { id: 'reserva-cpcv',         title: 'Reserva / CPCV',          color: 'green'  },
  { id: 'perdido-followup',     title: 'Perdido / Follow-up',     color: 'red'    },
];

// ✅ Temperatura configs para filtro
const temperatureFilters = [
  { value: 'all',       label: 'Todos',  icon: null },
  { value: 'hot',       label: 'Quente', icon: Flame },
  { value: 'warm',      label: 'Morno',  icon: Thermometer },
  { value: 'cold',      label: 'Frio',   icon: Snowflake },
];

async function createAutoTask(leadId: string, agencyId: string, userId: string, columnId: string) {
  const taskMap: Record<string, { title: string; daysOffset: number }> = {
    'visitas':             { title: 'Confirmar visita',     daysOffset: 1 },
    'proposta-negociacao': { title: 'Follow-up proposta',   daysOffset: 2 },
  };
  const task = taskMap[columnId];
  if (!task) return;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + task.daysOffset);
  await supabase.from('lead_tasks').insert({
    lead_id: leadId, agency_id: agencyId,
    title: task.title,
    due_date: dueDate.toISOString().split('T')[0],
    assigned_to: userId,
  });
}

async function logStageChange(leadId: string, agencyId: string, userId: string, fromColumn: string, toColumn: string) {
  await supabase.from('buyer_interactions').insert({
    lead_id: leadId, agency_id: agencyId,
    type: 'stage_change',
    note: `${fromColumn} → ${toColumn}`,
    created_by: userId,
  });
  await supabase.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', leadId);
}

// ✅ MELHORIA 1: registar contacto direto no cartão
async function logContactNow(leadId: string, agencyId: string, userId: string) {
  await supabase.from('buyer_interactions').insert({
    lead_id: leadId, agency_id: agencyId,
    type: 'call',
    note: 'Contacto rápido registado',
    created_by: userId,
  });
  await supabase.from('leads')
    .update({ last_contact_at: new Date().toISOString() })
    .eq('id', leadId);
}

export default function LeadsCompradores() {
  return (
    <DashboardLayout>
      <LeadsCompradoresContent />
    </DashboardLayout>
  );
}

function LeadsCompradoresContent() {
  const { leads, isLoading, addLead, updateLead, deleteLead, moveLead } = useLeads('buyer');
  const { currentUser, user } = useAuth();
  const { selectedAgentId } = useAgentFilter();
  const { data: leadSettings } = useLeadSettings(currentUser?.agencyId);

  // ✅ Estados de UI novos
  const [viewMode, setViewMode]               = useState<'cards' | 'list' | 'myday'>('cards');
  const [searchQuery, setSearchQuery]         = useState('');
  const [tempFilter, setTempFilter]           = useState('all');

  // Estados existentes
  const [activeId, setActiveId]               = useState<string | null>(null);
  const [draggedLead, setDraggedLead]         = useState<BuyerCardLead | null>(null);
  const [moveDialogOpen, setMoveDialogOpen]   = useState(false);
  const [pendingMove, setPendingMove]         = useState<{ leadId: string; targetColumnId: string } | null>(null);
  const [detailsOpen, setDetailsOpen]         = useState(false);
  const [selectedLead, setSelectedLead]       = useState<any>(null);
  const [addLeadOpen, setAddLeadOpen]         = useState(false);

  const isDirector = currentUser?.roles?.some(r =>
    ['diretor_geral', 'diretor_comercial', 'diretor_agencia'].includes(r)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const mappedLeads: BuyerCardLead[] = leads.map((lead: any) => ({
    id:              lead.id,
    clientName:      lead.client_name,
    phone:           lead.phone || '',
    email:           lead.email || '',
    agentName:       lead.agent_name || '',
    agentId:         lead.user_id,
    columnId:        lead.column_id,
    temperature:     lead.temperature || 'undefined',
    budgetMin:       lead.budget_min,
    budgetMax:       lead.budget_max,
    zones:           lead.zones || [],
    lastContactAt:   lead.last_contact_at,
    nextActionText:  lead.next_action_text,
    nextActionAt:    lead.next_action_at,
    source:          lead.source,
    typology:        lead.typology,
    buyerMotive:     lead.buyer_motive,
    buyerTimeline:   lead.buyer_timeline,
    buyerFinancing:  lead.buyer_financing,
    createdAt:       lead.created_at,
    columnEnteredAt: lead.column_entered_at,
  }));

  // Leads filtradas por agente + pesquisa (sem temperatura — para contar "Todos")
  const agentAndSearchLeads = useMemo(() => {
    return mappedLeads.filter(lead => {
      if (selectedAgentId !== 'all' && lead.agentId !== selectedAgentId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName  = lead.clientName?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [mappedLeads, selectedAgentId, searchQuery]);

  // Leads filtradas finais (agente + pesquisa + temperatura)
  const filteredLeads = useMemo(() => {
    if (tempFilter === 'all') return agentAndSearchLeads;
    return agentAndSearchLeads.filter(lead => lead.temperature === tempFilter);
  }, [agentAndSearchLeads, tempFilter]);

  // ✅ MELHORIA 5: leads "O meu dia" — próxima ação para hoje
  const myDayLeads = useMemo(() => {
    return filteredLeads.filter(lead => {
      if (!lead.nextActionAt) return false;
      try { return isToday(new Date(lead.nextActionAt)); } catch { return false; }
    });
  }, [filteredLeads]);

  const shouldShowMovePopup = (targetColumnId: string): boolean => {
    const popupMode: LeadMovePopupMode = leadSettings?.popupMode ?? 'always';
    if (popupMode === 'always')   return true;
    if (popupMode === 'never')    return false;
    if (popupMode === 'critical') {
      const criticalColumns = leadSettings?.criticalColumns || [];
      return criticalColumns.includes(targetColumnId);
    }
    return true;
  };

  const executeMove = (leadId: string, columnId: string, nextActivityDate?: string, nextActivityDescription?: string) => {
    const lead      = mappedLeads.find(l => l.id === leadId);
    const fromTitle = buyerColumns.find(c => c.id === lead?.columnId)?.title || '';
    const toTitle   = buyerColumns.find(c => c.id === columnId)?.title || '';

    moveLead.mutate({ id: leadId, column_id: columnId, next_activity_date: nextActivityDate, next_activity_description: nextActivityDescription });

    if (currentUser?.agencyId && user?.id) {
      createAutoTask(leadId, currentUser.agencyId, user.id, columnId);
      logStageChange(leadId, currentUser.agencyId, user.id, fromTitle, toTitle);
    }

    if (columnId === 'reserva-cpcv') {
      toast.info('Sugestão: Criar Processo para esta reserva', { duration: 5000 });
    }
  };

  // ✅ MELHORIA 1: handler do botão "Contactei"
  const handleContactLogged = async (leadId: string) => {
    if (!currentUser?.agencyId || !user?.id) return;
    await logContactNow(leadId, currentUser.agencyId, user.id);
    // Forçar re-fetch para atualizar o indicador de dias
    updateLead.mutate({ id: leadId, last_contact_at: new Date().toISOString() });
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
      const lead           = mappedLeads.find(l => l.id === active.id);
      const targetColumnId = over.id as string;
      if (lead && buyerColumns.some(c => c.id === targetColumnId) && lead.columnId !== targetColumnId) {
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

  const handleCardClick    = (lead: BuyerCardLead) => { setSelectedLead(lead); setDetailsOpen(true); };
  const handleMoveViaButton = (lead: BuyerCardLead, targetColumnId: string) => {
    if (shouldShowMovePopup(targetColumnId)) {
      setPendingMove({ leadId: lead.id, targetColumnId });
      setMoveDialogOpen(true);
    } else {
      executeMove(lead.id, targetColumnId);
    }
  };

  const handleSaveLead   = (leadId: string, updates: Record<string, any>) => { updateLead.mutate({ id: leadId, ...updates }); };
  const handleDeleteLead = (leadId: string) => { deleteLead.mutate(leadId); };
  const handleDuplicateLead = async (leadId: string, targetColumnId: string) => {
    if (!currentUser?.agencyId || !user?.id) return;
    const sourceLead = leads.find((l: any) => l.id === leadId);
    if (!sourceLead) return;
    const { error } = await supabase.from('leads').insert({
      client_name: sourceLead.client_name,
      email: sourceLead.email,
      phone: sourceLead.phone,
      source: sourceLead.source,
      column_id: targetColumnId,
      lead_type: 'seller',
      temperature: sourceLead.temperature,
      notes: sourceLead.notes,
      agency_id: currentUser.agencyId,
      user_id: user.id,
      budget_min: sourceLead.budget_min,
      budget_max: sourceLead.budget_max,
      zones: sourceLead.zones,
      typology: sourceLead.typology,
    });
    if (error) {
      toast.error('Erro ao duplicar lead: ' + error.message);
    } else {
      toast.success('Lead duplicada para CRM Vendedores');
    }
  };
  const handleAddLead    = (lead: KanbanLead) => {
    if (!currentUser?.agencyId) return;
    addLead.mutate({
      client_name: lead.clientName,
      email:       lead.email || undefined,
      phone:       lead.phone || undefined,
      source:      lead.source || undefined,
      column_id:   lead.columnId,
      temperature: lead.temperature,
      notes:       lead.notes || undefined,
      agency_id:   currentUser.agencyId,
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

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold font-heading">CRM Compradores</h1>
            <div className="flex items-center gap-3">
              <ToggleGroup type="single" value={viewMode} onValueChange={v => v && setViewMode(v as any)}>
                <ToggleGroupItem value="cards" aria-label="Vista Cartões">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vista Lista">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                {/* ✅ MELHORIA 5: botão "O meu dia" */}
                <ToggleGroupItem value="myday" aria-label="O meu dia" className="text-xs px-3">
                  Hoje
                </ToggleGroupItem>
              </ToggleGroup>
              <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Lead
              </Button>
            </div>
          </div>

          {/* ── Barra de pesquisa + filtros de temperatura ── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

            {/* ✅ MELHORIA 6: pesquisa global */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar nome ou telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* ✅ MELHORIA 3: filtros por temperatura */}
            <div className="flex gap-1.5 flex-wrap">
              {temperatureFilters.map(f => {
                const Icon = f.icon;
                const count = f.value === 'all'
                  ? agentAndSearchLeads.length
                  : agentAndSearchLeads.filter(l => l.temperature === f.value).length;
                return (
                  <Button
                    key={f.value}
                    variant={tempFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setTempFilter(f.value)}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {f.label}
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Director Metrics */}
          {isDirector && <BuyerMetricsDashboard leads={mappedLeads as any} />}

          {/* ✅ MELHORIA 5: Vista "O meu dia" */}
          {viewMode === 'myday' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-warning" />
                <h2 className="font-semibold text-base">O meu dia</h2>
                <Badge variant="secondary">{myDayLeads.length} ações para hoje</Badge>
              </div>
              {myDayLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <Sun className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Sem ações agendadas para hoje 🎉</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {myDayLeads.map(lead => (
                    <BuyerKanbanCard
                      key={lead.id}
                      lead={lead}
                      columns={buyerColumns}
                      isDragging={false}
                      onClick={() => handleCardClick(lead)}
                      onMove={targetId => handleMoveViaButton(lead, targetId)}
                      onContactLogged={handleContactLogged}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista Kanban */}
          {viewMode === 'cards' && (
            <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll">
              {buyerColumns.map(column => {
                const columnLeads = filteredLeads.filter(l => l.columnId === column.id);
                return (
                  <KanbanColumn
                    key={column.id} id={column.id} title={column.title}
                    color={column.color} count={columnLeads.length}
                    onEditTitle={() => {}} onDelete={() => {}} canDelete={false}
                  >
                    {columnLeads.map(lead => (
                      <BuyerKanbanCard
                        key={lead.id}
                        lead={lead}
                        columns={buyerColumns}
                        isDragging={activeId === lead.id}
                        onClick={() => handleCardClick(lead)}
                        onMove={targetId => handleMoveViaButton(lead, targetId)}
                        onContactLogged={handleContactLogged}
                        currentUserId={currentUser?.id}
                      />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          )}

          {/* Vista Lista */}
          {viewMode === 'list' && (
            <LeadsListView
              leads={filteredLeads as any}
              columns={buyerColumns}
              onLeadClick={(lead: any) => handleCardClick(lead)}
              currentUserId={currentUser?.id}
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedLead ? (
            <div className="kanban-card-dragging">
              <BuyerKanbanCard
                lead={draggedLead} columns={buyerColumns}
                isDragging={false} onClick={() => {}} onMove={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>

        {/* Move Dialog */}
        <MoveLeadDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          leadName={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.clientName || '' : ''}
          columns={buyerColumns}
          currentColumnId={pendingMove ? mappedLeads.find(l => l.id === pendingMove.leadId)?.columnId || '' : ''}
          targetColumnId={pendingMove?.targetColumnId}
          onConfirm={handleMoveConfirm}
          onCancel={() => { setMoveDialogOpen(false); setPendingMove(null); }}
        />

        {/* Details Sheet */}
        <BuyerDetailsSheet
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          lead={selectedLead}
          agencyId={currentUser?.agencyId}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          onDuplicate={handleDuplicateLead}
        />

        {/* Add Lead Dialog */}
        <AddLeadDialog
          open={addLeadOpen}
          onOpenChange={setAddLeadOpen}
          columns={buyerColumns}
          onAdd={handleAddLead}
        />
      </DndContext>
    </>
  );
}
