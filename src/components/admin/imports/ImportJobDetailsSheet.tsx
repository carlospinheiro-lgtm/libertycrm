import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileSpreadsheet, 
  CheckCircle, 
  RefreshCcw, 
  XCircle, 
  MinusCircle,
  ArrowRight 
} from 'lucide-react';
import { ImportJob } from '@/hooks/useImportJobs';

interface ImportJobDetailsSheetProps {
  job: ImportJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportJobDetailsSheet({ job, open, onOpenChange }: ImportJobDetailsSheetProps) {
  if (!job) return null;
  
  const summary = job.summary_json;
  const diffs = job.diff_json || [];
  
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "d MMM yyyy 'às' HH:mm", { locale: pt });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'processing':
        return <Badge variant="secondary">A processar</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Detalhes da Importação
          </SheetTitle>
          <SheetDescription>
            {job.file_name || 'Ficheiro desconhecido'}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Info básica */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {job.type === 'users' ? 'Utilizadores' : 'Equipas'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(job.status)}</div>
              </div>
              <div>
                <p className="text-muted-foreground">Data de Criação</p>
                <p className="font-medium">{formatDate(job.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data de Conclusão</p>
                <p className="font-medium">{formatDate(job.completed_at)}</p>
              </div>
            </div>
            
            <Separator />
            
            {/* Resumo */}
            {summary && (
              <>
                <div>
                  <h4 className="font-medium mb-3">Resumo</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Criados</p>
                        <p className="font-semibold text-emerald-700">{summary.created}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <RefreshCcw className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Atualizados</p>
                        <p className="font-semibold text-amber-700">{summary.updated}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <MinusCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Desativados</p>
                        <p className="font-semibold text-red-700">{summary.deactivated}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sem alterações</p>
                        <p className="font-semibold">{summary.unchanged}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {summary.errors && summary.errors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        Erros ({summary.errors.length})
                      </h4>
                      <div className="space-y-2">
                        {summary.errors.map((error, i) => (
                          <div key={i} className="text-sm p-2 rounded bg-destructive/10 text-destructive">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* Diferenças aplicadas */}
            {diffs.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Alterações Aplicadas ({diffs.length})</h4>
                  <div className="space-y-4">
                    {diffs.map((diff, i) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{diff.external_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(diff.appliedAt)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {diff.changes.map((change, j) => (
                            <div key={j} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground w-20">{change.fieldLabel}:</span>
                              <span className="text-red-600 line-through">
                                {change.currentValue || '-'}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-emerald-600 font-medium">
                                {change.newValue}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Notas */}
            {job.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{job.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
