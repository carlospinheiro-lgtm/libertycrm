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
  parseUserRows, 
  validateUserRow, 
  normalizeRole 
} from '@/lib/excel-parser';
import { ImportUserRow, ImportPreviewUser, ImportResult, FieldDiff } from '@/types/import';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useUpsertUserAgency, useDeactivateMissingUsers } from '@/hooks/useUsersSupabase';
import { useCreateImportJob } from '@/hooks/useImportJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, RefreshCcw, AlertTriangle } from 'lucide-react';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
}

type Step = 'upload' | 'preview' | 'confirm' | 'importing' | 'result';

export function ImportUsersDialog({
  open,
  onOpenChange,
  agencyId,
  agencyName,
}: ImportUsersDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<ImportUserRow[]>([]);
  const [previewData, setPreviewData] = useState<ImportPreviewUser[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: teams } = useTeamsByAgency(agencyId);
  const upsertUserAgency = useUpsertUserAgency();
  const deactivateMissing = useDeactivateMissingUsers();
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
    row: ImportUserRow,
    existing: { name: string; phone?: string | null; team?: string | null; isActive: boolean }
  ): FieldDiff[] => {
    const diffs: FieldDiff[] = [];
    
    if (row.nome !== existing.name) {
      diffs.push({
        field: 'name',
        fieldLabel: 'Nome',
        currentValue: existing.name,
        newValue: row.nome,
      });
    }
    
    if (row.telefone && row.telefone !== existing.phone) {
      diffs.push({
        field: 'phone',
        fieldLabel: 'Telefone',
        currentValue: existing.phone || null,
        newValue: row.telefone,
      });
    }
    
    const newTeamName = teams?.find(t => t.external_id === row.equipa)?.name;
    if (newTeamName && newTeamName !== existing.team) {
      diffs.push({
        field: 'team',
        fieldLabel: 'Equipa',
        currentValue: existing.team || null,
        newValue: newTeamName,
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
      const parsedRows = parseUserRows(rawRows);
      setRawData(parsedRows);
      
      // Validate and create preview with difference detection
      const preview: ImportPreviewUser[] = await Promise.all(
        parsedRows.map(async (row, index) => {
          const validationError = validateUserRow(row, index);
          const normalizedRole = normalizeRole(row.funcao);
          
          // Find team by external_id
          const team = teams?.find(t => t.external_id === row.equipa);
          
          // Check if user exists by external_id
          const { data: existingByExtId } = await supabase
            .from('user_agencies')
            .select(`
              id, 
              is_active,
              team_id,
              profiles:user_id (name, phone),
              teams:team_id (name)
            `)
            .eq('agency_id', agencyId)
            .eq('external_id', row.external_id)
            .maybeSingle();
          
          let action: ImportPreviewUser['action'] = 'create';
          let diffs: FieldDiff[] = [];
          let requiresConfirmation = false;
          
          if (validationError) {
            action = 'skip';
          } else if (row.estado === 'inativo') {
            action = 'deactivate';
          } else if (existingByExtId) {
            // Detetar diferenças
            const existingData = {
              name: (existingByExtId.profiles as any)?.name || '',
              phone: (existingByExtId.profiles as any)?.phone,
              team: (existingByExtId.teams as any)?.name,
              isActive: existingByExtId.is_active || false,
            };
            
            diffs = detectDiffs(row, existingData);
            
            if (diffs.length > 0) {
              action = 'update';
              requiresConfirmation = true; // Pedir confirmação para modificações
            } else {
              action = 'no_change';
            }
          }
          
          return {
            external_id: row.external_id,
            name: row.nome,
            email: row.email,
            phone: row.telefone,
            role: normalizedRole || row.funcao,
            team: team?.name || row.equipa,
            isActive: row.estado === 'ativo',
            action,
            diffs,
            requiresConfirmation,
            confirmed: false, // Começa não confirmado
            error: validationError || undefined,
            existingId: existingByExtId?.id,
          };
        })
      );
      
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
      
      // Filter users to import (new or confirmed updates)
      const usersToImport = rawData.filter((row, i) => {
        const preview = previewData[i];
        
        // Skip if has error
        if (preview.error) {
          result.errors.push(preview.error);
          return false;
        }
        
        // Track active external IDs
        if (row.estado === 'ativo') {
          activeExternalIds.push(row.external_id);
        }
        
        // No change - count but don't import
        if (preview.action === 'no_change') {
          result.unchanged++;
          return false;
        }
        
        // Update not confirmed - skip
        if (preview.action === 'update' && preview.requiresConfirmation && !preview.confirmed) {
          return false;
        }
        
        // Include new users, confirmed updates, and deactivations
        return preview.action === 'create' || 
               (preview.action === 'update' && preview.confirmed) ||
               preview.action === 'deactivate';
      });
      
      if (usersToImport.length > 0) {
        // Prepare data for Edge Function
        const usersData = usersToImport.map(row => {
          const team = teams?.find(t => t.external_id === row.equipa);
          const normalizedRole = normalizeRole(row.funcao);
          
          return {
            email: row.email.toLowerCase(),
            name: row.nome,
            phone: row.telefone,
            external_id: row.external_id,
            agency_id: agencyId,
            team_id: team?.id,
            role: normalizedRole || 'agente_imobiliario',
            is_active: row.estado === 'ativo',
          };
        });
        
        // Call Edge Function to create/update users
        const { data: importResponse, error: importError } = await supabase.functions.invoke('import-users', {
          body: { users: usersData, agency_id: agencyId },
        });
        
        if (importError) {
          console.error('Edge function error:', importError);
          result.errors.push(`Erro na função de importação: ${importError.message}`);
        } else if (importResponse) {
          console.log('Import response:', importResponse);
          
          if (importResponse.error) {
            result.errors.push(importResponse.error);
          } else if (importResponse.results) {
            // Process results from Edge Function
            for (const userResult of importResponse.results) {
              if (userResult.action === 'created') {
                result.created++;
              } else if (userResult.action === 'updated') {
                result.updated++;
              } else if (userResult.action === 'error') {
                result.errors.push(`${userResult.email}: ${userResult.error}`);
              }
            }
          }
        }
      }
      
      // Deactivate users not in the import
      if (activeExternalIds.length > 0) {
        try {
          const deactivatedCount = await deactivateMissing.mutateAsync({
            agencyId,
            activeExternalIds,
          });
          result.deactivated = deactivatedCount;
        } catch (error: any) {
          result.errors.push(`Erro ao desativar utilizadores: ${error.message}`);
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
        type: 'users',
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
      console.error('Import error:', error);
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
  const allUpdatesConfirmed = updateRecords.every(r => r.confirmed);
  const confirmedUpdates = updateRecords.filter(r => r.confirmed);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Utilizadores - {agencyName}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Carregue um ficheiro Excel com os dados dos utilizadores'}
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
                O ficheiro Excel deve conter as colunas: <strong>external_id</strong> (ou id), <strong>nome</strong>, <strong>email</strong>, <strong>funcao</strong>, <strong>equipa</strong> (opcional), <strong>estado</strong> (ativo/inativo)
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="font-medium">Clique para selecionar ficheiro</p>
                  <p className="text-sm text-muted-foreground">
                    Suporta ficheiros .xlsx
                  </p>
                </div>
              </Label>
              <Input
                id="file-upload"
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
                  <p className="text-xs text-muted-foreground">Novos</p>
                  <p className="text-lg font-semibold text-emerald-700">{newRecords.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <RefreshCcw className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Modificados</p>
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

            {/* Tabs para diferentes categorias */}
            <Tabs defaultValue={newRecords.length > 0 ? 'new' : updateRecords.length > 0 ? 'update' : 'all'}>
              <TabsList>
                <TabsTrigger value="all">Todos ({previewData.length})</TabsTrigger>
                {newRecords.length > 0 && (
                  <TabsTrigger value="new">Novos ({newRecords.length})</TabsTrigger>
                )}
                {updateRecords.length > 0 && (
                  <TabsTrigger value="update">Modificados ({updateRecords.length})</TabsTrigger>
                )}
                {noChangeRecords.length > 0 && (
                  <TabsTrigger value="unchanged">Sem alterações ({noChangeRecords.length})</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <ImportPreviewTable type="users" data={previewData} />
              </TabsContent>
              
              <TabsContent value="new" className="mt-4">
                <ImportPreviewTable type="users" data={newRecords} />
              </TabsContent>
              
              <TabsContent value="update" className="mt-4">
                <ImportPreviewTable type="users" data={updateRecords} />
              </TabsContent>
              
              <TabsContent value="unchanged" className="mt-4">
                <ImportPreviewTable type="users" data={noChangeRecords} />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Existem <strong>{updateRecords.length}</strong> registos com modificações. 
                Selecione quais pretende atualizar. Os não selecionados serão ignorados.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleConfirmAll}>
                Selecionar todos
              </Button>
            </div>

            <ImportPreviewTable 
              type="users" 
              data={updateRecords} 
              showConfirmation
              onConfirmChange={(index, confirmed) => {
                // Encontrar o índice no array original
                const originalIndex = previewData.findIndex(
                  p => p.external_id === updateRecords[index].external_id
                );
                if (originalIndex !== -1) {
                  handleConfirmChange(originalIndex, confirmed);
                }
              }}
            />

            <div className="text-sm text-muted-foreground">
              {confirmedUpdates.length} de {updateRecords.length} selecionados para atualização
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">A importar utilizadores...</p>
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
                  Continuar ({newRecords.length} novos, {updateRecords.length} para rever)
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
                Confirmar ({newRecords.length} novos + {confirmedUpdates.length} atualizações)
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
