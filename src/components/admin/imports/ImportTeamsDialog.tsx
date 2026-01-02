import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportPreviewTable } from './ImportPreviewTable';
import { ImportResultSummary } from './ImportResultSummary';
import { 
  parseExcelFile, 
  parseTeamRows, 
  validateTeamRow,
} from '@/lib/excel-parser';
import { ImportTeamRow, ImportPreviewTeam, ImportResult, FieldDiff } from '@/types/import';
import { useUpsertTeam, useDeactivateMissingTeams, useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useCreateImportJob } from '@/hooks/useImportJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, RefreshCcw, AlertTriangle } from 'lucide-react';

interface ImportTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
}

type Step = 'upload' | 'preview' | 'confirm' | 'importing' | 'result';

export function ImportTeamsDialog({
  open,
  onOpenChange,
  agencyId,
  agencyName,
}: ImportTeamsDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<ImportTeamRow[]>([]);
  const [previewData, setPreviewData] = useState<ImportPreviewTeam[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: existingTeams } = useTeamsByAgency(agencyId);
  const upsertTeam = useUpsertTeam();
  const deactivateMissing = useDeactivateMissingTeams();
  const createImportJob = useCreateImportJob();

  const resetState = useCallback(() => {
    setStep('upload');
    setFileName('');
    setRawData([]);
    setPreviewData([]);
    setImportResult(null);
    setIsProcessing(false);
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Detetar diferenças entre dados existentes e novos
  const detectDiffs = (
    row: ImportTeamRow,
    existing: { name: string; leader?: string | null; isActive: boolean }
  ): FieldDiff[] => {
    const diffs: FieldDiff[] = [];
    
    if (row.nome_equipa !== existing.name) {
      diffs.push({
        field: 'name',
        fieldLabel: 'Nome',
        currentValue: existing.name,
        newValue: row.nome_equipa,
      });
    }
    
    if (row.lider_equipa !== existing.leader) {
      diffs.push({
        field: 'leader',
        fieldLabel: 'Líder',
        currentValue: existing.leader || null,
        newValue: row.lider_equipa || '-',
      });
    }
    
    const isActive = row.estado === 'ativo';
    if (isActive !== existing.isActive) {
      diffs.push({
        field: 'status',
        fieldLabel: 'Estado',
        currentValue: existing.isActive ? 'Ativo' : 'Inativo',
        newValue: isActive ? 'Ativo' : 'Inativo',
      });
    }
    
    return diffs;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsProcessing(true);
    
    try {
      const rawRows = await parseExcelFile<Record<string, unknown>>(file);
      const parsedRows = parseTeamRows(rawRows);
      setRawData(parsedRows);
      
      // Validate and create preview with difference detection
      const preview: ImportPreviewTeam[] = parsedRows.map((row, index) => {
        const validationError = validateTeamRow(row, index);
        
        // Check if team exists
        const existingTeam = existingTeams?.find(t => t.external_id === row.external_id);
        
        let action: ImportPreviewTeam['action'] = 'create';
        let diffs: FieldDiff[] = [];
        let requiresConfirmation = false;
        
        if (validationError) {
          action = 'skip';
        } else if (row.estado === 'inativo') {
          action = 'deactivate';
        } else if (existingTeam) {
          // Detetar diferenças
          const existingData = {
            name: existingTeam.name,
            leader: existingTeam.external_id, // Would need to lookup leader external_id
            isActive: existingTeam.is_active || false,
          };
          
          // Simplified diff - compare name and status
          if (row.nome_equipa !== existingTeam.name) {
            diffs.push({
              field: 'name',
              fieldLabel: 'Nome',
              currentValue: existingTeam.name,
              newValue: row.nome_equipa,
            });
          }
          
          const isActive = row.estado === 'ativo';
          if (isActive !== existingTeam.is_active) {
            diffs.push({
              field: 'status',
              fieldLabel: 'Estado',
              currentValue: existingTeam.is_active ? 'Ativo' : 'Inativo',
              newValue: isActive ? 'Ativo' : 'Inativo',
            });
          }
          
          if (diffs.length > 0) {
            action = 'update';
            requiresConfirmation = true;
          } else {
            action = 'no_change';
          }
        }
        
        return {
          external_id: row.external_id,
          name: row.nome_equipa,
          leader: row.lider_equipa,
          isActive: row.estado === 'ativo',
          action,
          diffs,
          requiresConfirmation,
          confirmed: false,
          error: validationError || undefined,
          existingId: existingTeam?.id,
        };
      });
      
      setPreviewData(preview);
      setStep('preview');
    } catch (error) {
      toast.error('Erro ao processar ficheiro');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmChange = (index: number, confirmed: boolean) => {
    setPreviewData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], confirmed };
      return newData;
    });
  };

  const handleConfirmAll = () => {
    setPreviewData(prev => 
      prev.map(item => 
        item.requiresConfirmation ? { ...item, confirmed: true } : item
      )
    );
  };

  const handleImport = async () => {
    setStep('importing');
    
    const result: ImportResult = {
      created: 0,
      updated: 0,
      deactivated: 0,
      unchanged: 0,
      errors: [],
    };
    
    try {
      const activeExternalIds: string[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const preview = previewData[i];
        
        // Ignorar se tem erro
        if (preview.error) {
          result.errors.push(preview.error);
          continue;
        }
        
        if (preview.action === 'no_change') {
          result.unchanged++;
          if (row.estado === 'ativo') {
            activeExternalIds.push(row.external_id);
          }
          continue;
        }
        
        if (preview.action === 'update' && preview.requiresConfirmation && !preview.confirmed) {
          // Não atualizar se não foi confirmado
          if (row.estado === 'ativo') {
            activeExternalIds.push(row.external_id);
          }
          continue;
        }
        
        if (row.estado === 'ativo') {
          activeExternalIds.push(row.external_id);
        }
        
        try {
          // Find leader by external_id if provided
          let leaderUserId: string | undefined;
          if (row.lider_equipa) {
            const { data: leaderAgency } = await supabase
              .from('user_agencies')
              .select('user_id')
              .eq('agency_id', agencyId)
              .eq('external_id', row.lider_equipa)
              .maybeSingle();
            
            leaderUserId = leaderAgency?.user_id;
          }
          
          const { action } = await upsertTeam.mutateAsync({
            agencyId,
            externalId: row.external_id,
            data: {
              name: row.nome_equipa,
              leader_user_id: leaderUserId,
              is_active: row.estado === 'ativo',
            },
          });
          
          if (action === 'created') {
            result.created++;
          } else {
            result.updated++;
          }
          
        } catch (error: any) {
          result.errors.push(`Erro ao importar equipa ${row.nome_equipa}: ${error.message}`);
        }
      }
      
      // Deactivate teams not in the import
      if (activeExternalIds.length > 0) {
        try {
          const deactivatedCount = await deactivateMissing.mutateAsync({
            agencyId,
            activeExternalIds,
          });
          result.deactivated = deactivatedCount;
        } catch (error: any) {
          result.errors.push(`Erro ao desativar equipas: ${error.message}`);
        }
      }
      
      // Build diff_json for detailed logging
      const diffJson = previewData
        .filter(p => p.action === 'update' && p.confirmed && p.diffs && p.diffs.length > 0)
        .map(p => ({
          external_id: p.external_id,
          changes: p.diffs || [],
          appliedAt: new Date().toISOString(),
        }));
      
      // Log the import using import_jobs
      await createImportJob.mutateAsync({
        agency_id: agencyId,
        type: 'teams',
        file_name: fileName,
        status: 'completed',
        summary_json: {
          created: result.created,
          updated: result.updated,
          deactivated: result.deactivated,
          unchanged: result.unchanged,
          errors: result.errors,
        },
        diff_json: diffJson.length > 0 ? diffJson : undefined,
        notes: result.unchanged > 0 ? `${result.unchanged} sem alterações` : undefined,
      });
      
      setImportResult(result);
      setStep('result');
      
      if (result.errors.length === 0) {
        toast.success('Importação concluída com sucesso');
      } else {
        toast.warning(`Importação concluída com ${result.errors.length} erros`);
      }
      
    } catch (error: any) {
      toast.error('Erro durante a importação');
      result.errors.push(`Erro geral: ${error.message}`);
      setImportResult(result);
      setStep('result');
    }
  };

  // Categorizar registos
  const newRecords = previewData.filter(p => p.action === 'create');
  const updateRecords = previewData.filter(p => p.action === 'update');
  const noChangeRecords = previewData.filter(p => p.action === 'no_change');
  const errorRecords = previewData.filter(p => p.error);
  const deactivateRecords = previewData.filter(p => p.action === 'deactivate');
  
  const hasUpdates = updateRecords.length > 0;
  const confirmedUpdates = updateRecords.filter(r => r.confirmed);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Equipas - {agencyName}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Carregue um ficheiro Excel com a estrutura de equipas'}
            {step === 'preview' && 'Verifique os dados antes de confirmar a importação'}
            {step === 'confirm' && 'Confirme as modificações aos registos existentes'}
            {step === 'importing' && 'A processar importação...'}
            {step === 'result' && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                O ficheiro Excel deve conter as colunas: <strong>external_id</strong> (ou id), <strong>nome_equipa</strong>, <strong>lider_equipa</strong> (external_id do líder, opcional), <strong>estado</strong> (ativo/inativo)
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="team-file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="font-medium">Clique para selecionar ficheiro</p>
                  <p className="text-sm text-muted-foreground">
                    Suporta ficheiros .xlsx
                  </p>
                </div>
              </Label>
              <Input
                id="team-file-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A processar...
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Novas</p>
                  <p className="text-lg font-semibold text-emerald-700">{newRecords.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <RefreshCcw className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Modificadas</p>
                  <p className="text-lg font-semibold text-amber-700">{updateRecords.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50" />
                <div>
                  <p className="text-xs text-muted-foreground">Sem alterações</p>
                  <p className="text-lg font-semibold">{noChangeRecords.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Desativar</p>
                  <p className="text-lg font-semibold text-red-700">{deactivateRecords.length}</p>
                </div>
              </div>
              
              {errorRecords.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground">Erros</p>
                    <p className="text-lg font-semibold text-destructive">{errorRecords.length}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue={newRecords.length > 0 ? 'new' : updateRecords.length > 0 ? 'update' : 'all'}>
              <TabsList>
                <TabsTrigger value="all">Todas ({previewData.length})</TabsTrigger>
                {newRecords.length > 0 && (
                  <TabsTrigger value="new">Novas ({newRecords.length})</TabsTrigger>
                )}
                {updateRecords.length > 0 && (
                  <TabsTrigger value="update">Modificadas ({updateRecords.length})</TabsTrigger>
                )}
                {noChangeRecords.length > 0 && (
                  <TabsTrigger value="unchanged">Sem alterações ({noChangeRecords.length})</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <ImportPreviewTable type="teams" data={previewData} />
              </TabsContent>
              
              <TabsContent value="new" className="mt-4">
                <ImportPreviewTable type="teams" data={newRecords} />
              </TabsContent>
              
              <TabsContent value="update" className="mt-4">
                <ImportPreviewTable type="teams" data={updateRecords} />
              </TabsContent>
              
              <TabsContent value="unchanged" className="mt-4">
                <ImportPreviewTable type="teams" data={noChangeRecords} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Existem <strong>{updateRecords.length}</strong> equipas com modificações. 
                Selecione quais pretende atualizar. As não selecionadas serão ignoradas.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleConfirmAll}>
                Selecionar todas
              </Button>
            </div>

            <ImportPreviewTable 
              type="teams" 
              data={updateRecords} 
              showConfirmation
              onConfirmChange={(index, confirmed) => {
                const originalIndex = previewData.findIndex(
                  p => p.external_id === updateRecords[index].external_id
                );
                if (originalIndex !== -1) {
                  handleConfirmChange(originalIndex, confirmed);
                }
              }}
            />

            <div className="text-sm text-muted-foreground">
              {confirmedUpdates.length} de {updateRecords.length} selecionadas para atualização
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">A importar equipas...</p>
          </div>
        )}

        {step === 'result' && importResult && (
          <ImportResultSummary result={importResult} />
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              {hasUpdates ? (
                <Button onClick={() => setStep('confirm')}>
                  Continuar ({newRecords.length} novas, {updateRecords.length} para rever)
                </Button>
              ) : (
                <Button 
                  onClick={handleImport} 
                  disabled={newRecords.length === 0 && deactivateRecords.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Importação ({newRecords.length})
                </Button>
              )}
            </>
          )}
          
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Confirmar ({newRecords.length} novas + {confirmedUpdates.length} atualizações)
              </Button>
            </>
          )}
          
          {step === 'result' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
