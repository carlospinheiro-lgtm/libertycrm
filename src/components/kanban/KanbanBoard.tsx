import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
}

interface KanbanBoardProps {
  title: string;
  columns: Column[];
  leads: Lead[];
  onAddLead?: () => void;
  onMoveLead?: (leadId: string, newColumnId: string) => void;
}

export function KanbanBoard({
  title,
  columns,
  leads,
  onAddLead,
  onMoveLead,
}: KanbanBoardProps) {
  const [agentFilter, setAgentFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');

  const filteredLeads = leads.filter((lead) => {
    if (agentFilter !== 'all' && lead.agentName !== agentFilter) return false;
    if (agencyFilter !== 'all' && lead.agency !== agencyFilter) return false;
    return true;
  });

  const agents = [...new Set(leads.map((l) => l.agentName))];

  return (
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
        {columns.map((column) => {
          const columnLeads = filteredLeads.filter(
            (lead) => lead.columnId === column.id
          );
          return (
            <KanbanColumn
              key={column.id}
              title={column.title}
              color={column.color}
              count={columnLeads.length}
            >
              {columnLeads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>
    </div>
  );
}
