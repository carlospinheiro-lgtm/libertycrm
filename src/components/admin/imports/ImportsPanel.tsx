import { useState } from 'react';
import { useActiveAgencies } from '@/hooks/useAgencies';
import { useImportJobs } from '@/hooks/useImportJobs';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportAgencySelector } from './ImportAgencySelector';
import { ImportUsersDialog } from './ImportUsersDialog';
import { ImportTeamsDialog } from './ImportTeamsDialog';
import { ImportHistoryTable } from './ImportHistoryTable';
import { Upload, Users, Building2, AlertCircle } from 'lucide-react';

export function ImportsPanel() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  
  const { hasPermission } = useAuth();
  const { data: agencies, isLoading: agenciesLoading } = useActiveAgencies();
  const { data: importJobs, isLoading: jobsLoading } = useImportJobs(selectedAgencyId);
  
  const selectedAgency = agencies?.find(a => a.id === selectedAgencyId);
  
  // Verificar permissões - apenas utilizadores com permissão podem importar
  const canImport = hasPermission('admin.users.create') || hasPermission('admin.settings.update');

  if (!canImport) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Não tem permissões para aceder às importações.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Importação MAXWORK</h3>
        <p className="text-sm text-muted-foreground">
          Importar utilizadores e equipas a partir de ficheiros Excel do MAXWORK
        </p>
      </div>

      {/* Agency Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Selecionar Agência</CardTitle>
          <CardDescription>
            Escolha a agência para a qual pretende importar dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportAgencySelector
            agencies={agencies || []}
            selectedId={selectedAgencyId}
            onSelect={setSelectedAgencyId}
            isLoading={agenciesLoading}
          />
        </CardContent>
      </Card>

      {/* Warning */}
      {selectedAgency && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Está a importar dados para: <strong>{selectedAgency.name}</strong>. 
            Os dados importados serão marcados como sincronizados com MAXWORK.
          </AlertDescription>
        </Alert>
      )}

      {/* Import Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Importar Utilizadores</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ficheiro Excel com dados dos agentes e staff
                </p>
              </div>
              <Button 
                className="w-full" 
                disabled={!selectedAgencyId}
                onClick={() => setUsersDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Utilizadores
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Importar Equipas</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ficheiro Excel com estrutura de equipas
                </p>
              </div>
              <Button 
                className="w-full" 
                disabled={!selectedAgencyId}
                onClick={() => setTeamsDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Equipas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      {selectedAgencyId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Importações</CardTitle>
            <CardDescription>
              Registo das importações realizadas para esta agência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportHistoryTable 
              jobs={importJobs || []} 
              isLoading={jobsLoading} 
            />
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedAgencyId && selectedAgency && (
        <>
          <ImportUsersDialog
            open={usersDialogOpen}
            onOpenChange={setUsersDialogOpen}
            agencyId={selectedAgencyId}
            agencyName={selectedAgency.name}
          />
          <ImportTeamsDialog
            open={teamsDialogOpen}
            onOpenChange={setTeamsDialogOpen}
            agencyId={selectedAgencyId}
            agencyName={selectedAgency.name}
          />
        </>
      )}
    </div>
  );
}
