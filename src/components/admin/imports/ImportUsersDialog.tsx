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
import { ImportPreviewTable } from './ImportPreviewTable';
import { ImportResultSummary } from './ImportResultSummary';
import { 
  parseExcelFile, 
  parseUserRows, 
  validateUserRow, 
  normalizeRole 
} from '@/lib/excel-parser';
import { ImportUserRow, ImportPreviewUser, ImportResult } from '@/types/import';
import { useTeamsByAgency } from '@/hooks/useTeamsSupabase';
import { useUpsertUserAgency, useDeactivateMissingUsers } from '@/hooks/useUsersSupabase';
import { useCreateImportLog } from '@/hooks/useImportLogs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  agencyName: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'result';

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
  const createImportLog = useCreateImportLog();

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
      const parsedRows = parseUserRows(rawRows);
      setRawData(parsedRows);
      
      // Validate and create preview
      const preview: ImportPreviewUser[] = await Promise.all(
        parsedRows.map(async (row, index) => {
          const validationError = validateUserRow(row, index);
          const normalizedRole = normalizeRole(row.funcao);
          
          // Find team by external_id
          const team = teams?.find(t => t.external_id === row.equipa);
          
          // Check if user exists by external_id
          const { data: existingByExtId } = await supabase
            .from('user_agencies')
            .select('id')
            .eq('agency_id', agencyId)
            .eq('external_id', row.external_id)
            .maybeSingle();
          
          return {
            external_id: row.external_id,
            name: row.nome,
            email: row.email,
            phone: row.telefone,
            role: normalizedRole || row.funcao,
            team: team?.name || row.equipa,
            isActive: row.estado === 'ativo',
            action: validationError 
              ? 'skip' as const
              : row.estado === 'inativo' 
                ? 'deactivate' as const
                : existingByExtId 
                  ? 'update' as const 
                  : 'create' as const,
            error: validationError || undefined,
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

  const handleImport = async () => {
    setStep('importing');
    
    const result: ImportResult = {
      created: 0,
      updated: 0,
      deactivated: 0,
      errors: [],
    };
    
    try {
      const activeExternalIds: string[] = [];
      
      for (const row of rawData) {
        if (row.estado === 'ativo') {
          activeExternalIds.push(row.external_id);
        }
        
        const validationError = validateUserRow(row, rawData.indexOf(row));
        if (validationError) {
          result.errors.push(validationError);
          continue;
        }
        
        try {
          // Check if profile exists by email
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', row.email.toLowerCase())
            .maybeSingle();
          
          let profileId = existingProfile?.id;
          
          // If profile doesn't exist, we can't create it without auth
          // Just create/update the user_agency record
          if (!profileId) {
            // Create a placeholder profile (in real app, this would be via auth)
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: crypto.randomUUID(),
                email: row.email.toLowerCase(),
                name: row.nome,
                phone: row.telefone,
                is_active: row.estado === 'ativo',
              })
              .select()
              .single();
            
            if (profileError) {
              result.errors.push(`Erro ao criar perfil para ${row.email}: ${profileError.message}`);
              continue;
            }
            
            profileId = newProfile.id;
          }
          
          // Find team
          const team = teams?.find(t => t.external_id === row.equipa);
          
          // Upsert user_agency
          const { action } = await upsertUserAgency.mutateAsync({
            agencyId,
            externalId: row.external_id,
            profileId,
            teamId: team?.id,
            data: {
              is_active: row.estado === 'ativo',
            },
          });
          
          if (action === 'created') {
            result.created++;
          } else {
            result.updated++;
          }
          
        } catch (error: any) {
          result.errors.push(`Erro ao importar ${row.nome}: ${error.message}`);
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
      
      // Log the import
      await createImportLog.mutateAsync({
        agency_id: agencyId,
        import_type: 'users',
        file_name: fileName,
        created_count: result.created,
        updated_count: result.updated,
        deactivated_count: result.deactivated,
        notes: result.errors.length > 0 ? `${result.errors.length} erros` : null,
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

  const validRows = previewData.filter(p => !p.error);
  const errorRows = previewData.filter(p => p.error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Utilizadores - {agencyName}</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Carregue um ficheiro Excel com os dados dos utilizadores'}
            {step === 'preview' && 'Verifique os dados antes de confirmar a importação'}
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
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{validRows.length}</strong> registos válidos
              </span>
              {errorRows.length > 0 && (
                <span className="text-destructive">
                  <strong>{errorRows.length}</strong> com erros
                </span>
              )}
            </div>
            
            <ImportPreviewTable type="users" data={previewData} />
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
              <Button 
                onClick={handleImport} 
                disabled={validRows.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Confirmar Importação ({validRows.length})
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
