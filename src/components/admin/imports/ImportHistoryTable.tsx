import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, FileSpreadsheet, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ImportJob } from '@/hooks/useImportJobs';
import { ImportJobDetailsSheet } from './ImportJobDetailsSheet';

interface ImportHistoryTableProps {
  jobs: ImportJob[];
  isLoading?: boolean;
}

export function ImportHistoryTable({ jobs, isLoading }: ImportHistoryTableProps) {
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const handleViewDetails = (job: ImportJob) => {
    setSelectedJob(job);
    setDetailsOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Falhou
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            A processar
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Pendente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma importação registada</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Ficheiro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Criados</TableHead>
              <TableHead className="text-right">Atualizados</TableHead>
              <TableHead className="text-right">Desativados</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const summary = job.summary_json;
              
              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      {job.type === 'users' ? (
                        <>
                          <Users className="h-3 w-3" />
                          Utilizadores
                        </>
                      ) : (
                        <>
                          <Building2 className="h-3 w-3" />
                          Equipas
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {job.file_name || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.created_at 
                      ? format(new Date(job.created_at), "d MMM yyyy 'às' HH:mm", { locale: pt })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success" className="min-w-[2rem] justify-center">
                      +{summary?.created || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="min-w-[2rem] justify-center">
                      ~{summary?.updated || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="min-w-[2rem] justify-center">
                      -{summary?.deactivated || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(job)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <ImportJobDetailsSheet
        job={selectedJob}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
