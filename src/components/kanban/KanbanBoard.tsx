import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { MoveLeadDialog } from './MoveLeadDialog';
import { LeadDetailsSheet } from './LeadDetailsSheet';
import { AddColumnDialog } from './AddColumnDialog';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKanbanState, KanbanLead, KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanState';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import type { LeadTemperature } from '@/types';

export interface Column {
  id: string;
  title: string;
  color: string;
}

export interface Lead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  agency: string;
  source: string;
  entryDate: string;
  notes?: string;
  columnId: string;
  temperature?: LeadTemperature;
  nextActivityDate?: string;
  nextActivityDescription?: string;
}

interface KanbanBoardProps {
  title: string;
  columns: Column[];
  leads: Lead[];
  onAddLead?: () => void;
}

export function KanbanBoard({
  title,
  columns: initialColumns,
  leads: initialLeads,
  onAddLead,
}: KanbanBoardProps) {
  const [agentFilter, setAgentFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');

  // Convert leads to include temperature
  const leadsWithTemperature: KanbanLead[] = initialLeads.map(lead => ({
    ...lead,
    temperature: lead.temperature || 'undefined',
  }));

  const {
    columns,
    leads,
    moveLead,
    updateLead,
    deleteLead,
    addColumn,
    editColumn,
    deleteColumn,
  } = useKanbanState({
    initialColumns,
    initialLeads: leadsWithTemperature,
  });

  const { createActivity } = useCalendarSync();

  // Drag and Drop State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<KanbanLead | null>(null);
  
  // Modal States
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ leadId: string; targetColumnId: string } | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const filteredLeads = leads.filter((lead) => {
    if (agentFilter !== 'all' && lead.agentName !== agentFilter) return false;
    if (agencyFilter !== 'all' && lead.agency !== agencyFilter) return false;
    return true;
  });

  const agents = [...new Set(leads.map((l) => l.agentName))];

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find(l => l.id === event.active.id);
    setActiveId(event.active.id as string);
    setDraggedLead(lead || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedLead(null);

    if (over && active.id !== over.id) {
      const lead = leads.find(l => l.id === active.id);
      const targetColumnId = over.id as string;
      
      // Check if dropping on a column
      if (lead && columns.some(c => c.id === targetColumnId) && lead.columnId !== targetColumnId) {
        setPendingMove({ leadId: lead.id, targetColumnId });
        setMoveDialogOpen(true);
      }
    }
  };

  const handleMoveConfirm = (columnId: string, nextActivityDate: string, nextActivityDescription: string) => {
    if (pendingMove) {
      moveLead(pendingMove.leadId, columnId, nextActivityDate, nextActivityDescription);
      
      const lead = leads.find(l => l.id === pendingMove.leadId);
      if (lead && nextActivityDate) {
        createActivity({
          leadId: lead.id,
          title: `Atividade: ${lead.clientName}`,
          description: nextActivityDescription || `Movido para ${columns.find(c => c.id === columnId)?.title}`,
          date: nextActivityDate,
        });
      }
    }
    setMoveDialogOpen(false);
    setPendingMove(null);
  };

  const handleMoveCancel = () => {
    setMoveDialogOpen(false);
    setPendingMove(null);
  };

  const handleCardClick = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setDetailsSheetOpen(true);
  };

  const handleMoveViaButton = (lead: KanbanLead, targetColumnId: string) => {
    setPendingMove({ leadId: lead.id, targetColumnId });
    setMoveDialogOpen(true);
  };

  const handleAddColumn = (title: string, color: string) => {
    addColumn({ id: crypto.randomUUID(), title, color });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold font-heading">{title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Braga">Braga</SelectItem>
                <SelectItem value="Barcelos">Barcelos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>

            <Button onClick={onAddLead} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Lead
            </Button>
          </div>
        </div>

        {/* Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-scroll">
          {columns.map((column, index) => {
            const columnLeads = filteredLeads.filter(
              (lead) => lead.columnId === column.id
            );
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                count={columnLeads.length}
                onEditTitle={(newTitle) => editColumn(column.id, { title: newTitle })}
                onDelete={() => deleteColumn(column.id)}
                canDelete={columns.length > 1 && index > 0}
              >
                {columnLeads.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    columns={columns}
                    isDragging={activeId === lead.id}
                    onClick={() => handleCardClick(lead)}
                    onMove={(targetColumnId) => handleMoveViaButton(lead, targetColumnId)}
                  />
                ))}
              </KanbanColumn>
            );
          })}

          {/* Add Column Button */}
          <div className="flex-shrink-0 w-72">
            <Button
              variant="outline"
              className="w-full h-20 border-dashed"
              onClick={() => setAddColumnDialogOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Coluna
            </Button>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedLead ? (
          <div className="kanban-card-dragging">
            <KanbanCard
              lead={draggedLead}
              columns={columns}
              isDragging={false}
              onClick={() => {}}
              onMove={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Move Dialog */}
      <MoveLeadDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        leadName={pendingMove ? leads.find(l => l.id === pendingMove.leadId)?.clientName || '' : ''}
        columns={columns}
        currentColumnId={pendingMove ? leads.find(l => l.id === pendingMove.leadId)?.columnId || '' : ''}
        targetColumnId={pendingMove?.targetColumnId}
        onConfirm={handleMoveConfirm}
        onCancel={handleMoveCancel}
      />

      {/* Details Sheet */}
      <LeadDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        lead={selectedLead}
        onSave={updateLead}
        onDelete={deleteLead}
      />

      {/* Add Column Dialog */}
      <AddColumnDialog
        open={addColumnDialogOpen}
        onOpenChange={setAddColumnDialogOpen}
        onAdd={handleAddColumn}
      />
    </DndContext>
  );
}
