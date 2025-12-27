import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SourcesTable } from '@/components/sources/SourcesTable';
import { AddSourceDialog } from '@/components/sources/AddSourceDialog';
import { EditSourceDialog } from '@/components/sources/EditSourceDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Tag } from 'lucide-react';
import { useSources } from '@/hooks/useSources';
import { Source, SourceFlow, SourceCategory, SourceType, sourceCategoryLabels, sourceFlowLabels, sourceTypeLabels } from '@/types';

export default function Origens() {
  const { sources, addSource, updateSource, deleteSource, toggleSourceActive } = useSources();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [flowFilter, setFlowFilter] = useState<SourceFlow | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SourceCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all');

  const filteredSources = sources.filter(source => {
    if (flowFilter !== 'all' && source.flow !== flowFilter && source.flow !== 'ambos') return false;
    if (categoryFilter !== 'all' && source.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && source.sourceType !== typeFilter) return false;
    return true;
  });

  const handleEdit = (source: Source) => {
    setSelectedSource(source);
    setEditDialogOpen(true);
  };

  const handleAdd = (data: Omit<Source, 'id' | 'createdAt'>) => {
    addSource(data);
  };

  const handleUpdate = (id: string, data: Partial<Source>) => {
    updateSource(id, data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              Gestão de Origens
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure as origens para rastreio de leads e métricas de conversão
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={flowFilter} onValueChange={(v) => setFlowFilter(v as SourceFlow | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fluxo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Fluxos</SelectItem>
                {Object.entries(sourceFlowLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SourceType | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(sourceTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as SourceCategory | 'all')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {Object.entries(sourceCategoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Origem
            </Button>
          </div>
        </div>

        {/* Sources Table */}
        <SourcesTable 
          sources={filteredSources}
          onEdit={handleEdit}
          onDelete={deleteSource}
          onToggleActive={toggleSourceActive}
        />
      </div>

      {/* Dialogs */}
      <AddSourceDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
      
      {selectedSource && (
        <EditSourceDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          source={selectedSource}
          onSave={handleUpdate}
        />
      )}
    </DashboardLayout>
  );
}
