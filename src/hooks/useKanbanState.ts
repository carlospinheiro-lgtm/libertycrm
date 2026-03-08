import { useState, useCallback } from 'react';
import type { LeadTemperature, SourceCategory } from '@/types';

export interface KanbanLead {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  agentName: string;
  agentId?: string;
  agency: string;
  source: string;
  sourceId: string;
  sourceCategory: SourceCategory;
  entryDate: string;
  notes?: string;
  columnId: string;
  temperature: LeadTemperature;
  nextActivityDate?: string;
  nextActivityDescription?: string;
  cvUrl?: string;
  clientType?: 'comprador' | 'vendedor' | 'ambos';
  contractDuration?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

interface UseKanbanStateProps {
  initialColumns: KanbanColumn[];
  initialLeads: KanbanLead[];
}

export function useKanbanState({ initialColumns, initialLeads }: UseKanbanStateProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [leads, setLeads] = useState<KanbanLead[]>(initialLeads);

  const moveLead = useCallback((leadId: string, newColumnId: string, nextActivityDate?: string, nextActivityDescription?: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, columnId: newColumnId, nextActivityDate, nextActivityDescription }
        : lead
    ));
  }, []);

  const updateLead = useCallback((leadId: string, updates: Partial<KanbanLead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    ));
  }, []);

  const addLead = useCallback((lead: KanbanLead) => {
    setLeads(prev => [...prev, lead]);
  }, []);

  const deleteLead = useCallback((leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  }, []);

  const addColumn = useCallback((column: KanbanColumn) => {
    setColumns(prev => [...prev, column]);
  }, []);

  const editColumn = useCallback((columnId: string, updates: Partial<KanbanColumn>) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
  }, []);

  const deleteColumn = useCallback((columnId: string) => {
    // Move leads from deleted column to the first column
    const firstColumn = columns[0];
    if (firstColumn && firstColumn.id !== columnId) {
      setLeads(prev => prev.map(lead => 
        lead.columnId === columnId ? { ...lead, columnId: firstColumn.id } : lead
      ));
    }
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, [columns]);

  const reorderColumns = useCallback((newOrder: KanbanColumn[]) => {
    setColumns(newOrder);
  }, []);

  return {
    columns,
    leads,
    moveLead,
    updateLead,
    addLead,
    deleteLead,
    addColumn,
    editColumn,
    deleteColumn,
    reorderColumns,
  };
}
