import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useProperty } from '@/hooks/useProperties';
import { usePropertyChecklist } from '@/hooks/usePropertyChecklist';
import { usePropertyVisits } from '@/hooks/usePropertyVisits';
import { usePropertyPortals } from '@/hooks/usePropertyPortals';
import { usePropertyDocuments } from '@/hooks/usePropertyDocuments';
import { usePropertyActivities } from '@/hooks/usePropertyActivities';
import { PropertyStageKanban } from '@/components/angariacoes/PropertyStageKanban';
import { PropertySummaryTab } from '@/components/angariacoes/PropertySummaryTab';
import { PropertyMediaTab } from '@/components/angariacoes/PropertyMediaTab';
import { PropertyVisitsTab } from '@/components/angariacoes/PropertyVisitsTab';
import { PropertyDocumentsTab } from '@/components/angariacoes/PropertyDocumentsTab';
import { PropertyHistoryTab } from '@/components/angariacoes/PropertyHistoryTab';
import { LogVisitDialog } from '@/components/angariacoes/LogVisitDialog';
import { RenewContractDialog } from '@/components/angariacoes/RenewContractDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ClipboardList, Image, Eye, FileText, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function AngariacaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: property, isLoading } = useProperty(id);
  const { items: checklistItems, toggleItem } = usePropertyChecklist(id);
  const { visits, addVisit } = usePropertyVisits(id);
  const { portals, updatePortal } = usePropertyPortals(id);
  const { documents } = usePropertyDocuments(id);
  const { activities, addActivity } = usePropertyActivities(id);

  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">
          Angariação não encontrada
          <br />
          <Button variant="outline" className="mt-4" onClick={() => navigate('/angariacoes')}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleChecklist = (itemId: string, completed: boolean) => {
    toggleItem.mutate({ id: itemId, is_completed: completed });
  };

  const handleStageChange = async (stage: string) => {
    await supabase
      .from('properties')
      .update({ current_stage: stage, stage_entered_at: new Date().toISOString() })
      .eq('id', property.id);
    queryClient.invalidateQueries({ queryKey: ['property', id] });
    queryClient.invalidateQueries({ queryKey: ['property-checklist', id] });
    toast.success(`Etapa alterada para ${stage}`);
  };

  const handleAddVisit = (data: any) => {
    if (!property.agency_id || !user) return;
    addVisit.mutate({
      property_id: property.id,
      agency_id: property.agency_id,
      agent_id: user.id,
      follow_up_created: false,
      ...data,
    });
  };

  const handleRenewContract = async (newEndDate: string, months: number) => {
    await supabase
      .from('properties')
      .update({
        contract_end_date: newEndDate,
        contract_duration_months: (property.contract_duration_months || 0) + months,
      })
      .eq('id', property.id);
    queryClient.invalidateQueries({ queryKey: ['property', id] });
    toast.success('Contrato renovado com sucesso');
  };

  const handleTogglePortal = (portalId: string, published: boolean) => {
    updatePortal.mutate({
      id: portalId,
      is_published: published,
      ...(published ? { publish_date: new Date().toISOString().split('T')[0] } : {}),
      last_updated: new Date().toISOString(),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/angariacoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{property.reference}</h1>
            <p className="text-sm text-muted-foreground">{property.address || 'Sem morada'}</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Kanban */}
          <div className="lg:col-span-3">
            <PropertyStageKanban
              property={property}
              checklistItems={checklistItems}
              onToggleChecklist={handleToggleChecklist}
              onStageChange={handleStageChange}
            />
          </div>

          {/* Right: Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="resumo" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="resumo" className="text-xs px-1">
                  <ClipboardList className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="media" className="text-xs px-1">
                  <Image className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="visitas" className="text-xs px-1">
                  <Eye className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="documentos" className="text-xs px-1">
                  <FileText className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="historico" className="text-xs px-1">
                  <History className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resumo" className="mt-4">
                <PropertySummaryTab property={property} onRenewContract={() => setRenewDialogOpen(true)} />
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                <PropertyMediaTab property={property} portals={portals} onTogglePortal={handleTogglePortal} />
              </TabsContent>
              <TabsContent value="visitas" className="mt-4">
                <PropertyVisitsTab visits={visits} onAddVisit={() => setVisitDialogOpen(true)} />
              </TabsContent>
              <TabsContent value="documentos" className="mt-4">
                <PropertyDocumentsTab documents={documents} onAddDocument={() => {}} />
              </TabsContent>
              <TabsContent value="historico" className="mt-4">
                <PropertyHistoryTab activities={activities} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <LogVisitDialog
        open={visitDialogOpen}
        onOpenChange={setVisitDialogOpen}
        onSubmit={handleAddVisit}
      />
      <RenewContractDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        currentEndDate={property.contract_end_date}
        onSubmit={handleRenewContract}
      />
    </DashboardLayout>
  );
}
