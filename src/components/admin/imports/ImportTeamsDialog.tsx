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
  parseMembersString,
} from '@/lib/excel-parser';
import { ImportTeamRow, ImportPreviewTeam, ImportResult, FieldDiff } from '@/types/import';
import { useUpsertTeam, useDeactivateMissingTeams, useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useSyncTeamMemberships } from '@/hooks/useTeamMemberships';
import { useCreateImportJob } from '@/hooks/useImportJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, RefreshCcw, AlertTriangle, Users } from 'lucide-react';

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
  const syncMemberships = useSyncTeamMemberships();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsProcessing(true);
    
    try {
      const rawRows = await parseExcelFile<Record<string, unknown>>(file);
      const parsedRows = parseTeamRows(rawRows);
      setRawData(parsedRows);
      
      // Get user_agencies to validate member external_ids
      const { data: userAgencies } = await supabase
        .from('user_agencies')
        .select('external_id')
        .eq('agency_id', agencyId)
        .eq('is_active', true);
      
      const validExternalIds = new Set(userAgencies?.map(ua => ua.external_id).filter(Boolean) || []);
      
      // Validate and create preview with difference detection
      const preview: ImportPreviewTeam[] = parsedRows.map((row, index) => {
        const validationError = validateTeamRow(row, index);
        
        // Parse members
        const membersList = parseMembersString(row.membros);
        
        // Validate member external_ids
        const invalidMembers = membersList.filter(id => !validExternalIds.has(id));
        let memberError = '';
        if (invalidMembers.length > 0) {
          memberError = `Membros não encontrados: ${invalidMembers.slice(0, 3).join(', ')}${invalidMembers.length > 3 ? '...' : ''}`;
        }
        
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
          // Detect differences
          if (row.nome_equipa !== existingTeam.name) {
            diffs.push({
              field: 'name',
              fieldLabel: 'Nome',
              currentValue: existingTeam.name,
              newValue: row.nome_equipa,
            });
          }
          
          if (row.nickname !== existingTeam.nickname) {
            diffs.push({
              field: 'nickname',
              fieldLabel: 'Nickname',
              currentValue: existingTeam.nickname || null,
              newValue: row.nickname || '-',
            });
          }
          
          if (row.tipo_equipa !== existingTeam.team_type) {
            diffs.push({
              field: 'team_type',
              fieldLabel: 'Tipo',
              currentValue: existingTeam.team_type || null,
              newValue: row.tipo_equipa || '-',
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
        
        const combinedError = [validationError, memberError].filter(Boolean).join('; ');
        
        return {
          external_id: row.external_id,
          name: row.nome_equipa,
          nickname: row.nickname,
          teamType: row.tipo_equipa,
          leader: row.lider_equipa,
          members: membersList,
          membersCount: membersList.length,
          isActive: row.estado === 'ativo',
          action,
          diffs,
          requiresConfirmation,
          confirmed: false,
          error: combinedError || undefined,
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
      membersCreated: 0,
      membersUpdated: 0,
      membersDeactivated: 0,
    };
    
    try {
      const activeExternalIds: string[] = [];
      const teamsWithMembers: { teamId: string; preview: ImportPreviewTeam; row: ImportTeamRow }[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const preview = previewData[i];
        
        // Skip if has error
        if (preview.error && preview.action === 'skip') {
          result.errors.push(preview.error);
          continue;
        }
        
        if (preview.action === 'no_change') {
          result.unchanged++;
          if (row.estado === 'ativo') {
            activeExternalIds.push(row.external_id);
          }
          // Still need to sync members for unchanged teams
          if (preview.existingId && preview.members && preview.members.length > 0) {
            teamsWithMembers.push({ teamId: preview.existingId, preview, row });
          }
          continue;
        }
        
        if (preview.action === 'update' && preview.requiresConfirmation && !preview.confirmed) {
          // Don't update if not confirmed
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
          
          const { action, data: teamData } = await upsertTeam.mutateAsync({
            agencyId,
            externalId: row.external_id,
            data: {
              name: row.nome_equipa,
              nickname: row.nickname,
              team_type: row.tipo_equipa,
              leader_user_id: leaderUserId,
              is_active: row.estado === 'ativo',
            },
          });
          
          if (action === 'created') {
            result.created++;
          } else {
            result.updated++;
          }
          
          // Add to list for member sync
          if (preview.members && preview.members.length > 0) {
            teamsWithMembers.push({ teamId: teamData.id, preview, row });
          }
          
        } catch (error: any) {
          result.errors.push(`Erro ao importar equipa ${row.nome_equipa}: ${error.message}`);
        }
      }
      
      // Sync team memberships
      for (const { teamId, preview, row } of teamsWithMembers) {
        try {
          const syncResult = await syncMemberships.mutateAsync({
            teamId,
            agencyId,
            memberExternalIds: preview.members || [],
            leaderExternalId: row.lider_equipa,
          });
          
          result.membersCreated = (result.membersCreated || 0) + syncResult.created;
          result.membersUpdated = (result.membersUpdated || 0) + syncResult.updated;
          result.membersDeactivated = (result.membersDeactivated || 0) + syncResult.deactivated;
          
          if (syncResult.errors.length > 0) {
            result.errors.push(...syncResult.errors);
          }
        } catch (error: any) {
          result.errors.push(`Erro ao sincronizar membros de ${row.nome_equipa}: ${error.message}`);
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
          members: p.members,
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
          membersCreated: result.membersCreated,
          membersUpdated: result.membersUpdated,
          membersDeactivated: result.membersDeactivated,
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

  // Categorize records
  const newRecords = previewData.filter(p => p.action === 'create');
  const updateRecords = previewData.filter(p => p.action === 'update');
  const noChangeRecords = previewData.filter(p => p.action === 'no_change');
  const errorRecords = previewData.filter(p => p.error);
  const deactivateRecords = previewData.filter(p => p.action === 'deactivate');
  
  const hasUpdates = updateRecords.length > 0;
  const confirmedUpdates = updateRecords.filter(r => r.confirmed);
  
  // Total members count
  const totalMembers = previewData.reduce((acc, p) => acc + (p.membersCount || 0), 0);

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
                O ficheiro Excel deve conter as colunas: <strong>external_id</strong>, <strong>nome_equipa</strong>, 
                <strong> nickname</strong> (opcional), <strong>tipo_equipa</strong> (opcional), 
                <strong> lider_equipa</strong> (external_id, opcional), <strong>membros</strong> (lista separada por vírgulas, opcional), 
                <strong> estado</strong>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="team-file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="font-medium">Clique para selecionar ficheiro</p>
                  <p className="text-sm text-muted-foreground">
                    Suporta ficheiros .xlsx, .xls, .csv
                  </p>
                </div>
              </Label>
              <Input
                id="team-file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
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
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Membros</p>
                  <p className="text-lg font-semibold text-blue-700">{totalMembers}</p>
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
            <p className="text-muted-foreground">A importar equipas e membros...</p>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <ImportResultSummary result={importResult} />
            
            {/* Extended result for members */}
            {(importResult.membersCreated || importResult.membersUpdated || importResult.membersDeactivated) && (
              <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membros de Equipa
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Adicionados:</span>
                    <span className="ml-2 font-medium text-emerald-600">{importResult.membersCreated || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Atualizados:</span>
                    <span className="ml-2 font-medium text-amber-600">{importResult.membersUpdated || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Removidos:</span>
                    <span className="ml-2 font-medium text-red-600">{importResult.membersDeactivated || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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
                  disabled={newRecords.length === 0 && deactivateRecords.length === 0 && noChangeRecords.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Importação ({newRecords.length} equipas, {totalMembers} membros)
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
