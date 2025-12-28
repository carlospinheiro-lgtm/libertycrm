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
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, FileSpreadsheet } from 'lucide-react';
import { ImportLog } from '@/hooks/useImportLogs';

interface ImportHistoryTableProps {
  logs: ImportLog[];
  isLoading?: boolean;
}

export function ImportHistoryTable({ logs, isLoading }: ImportHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma importação registada</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Ficheiro</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Criados</TableHead>
            <TableHead className="text-right">Atualizados</TableHead>
            <TableHead className="text-right">Desativados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  {log.import_type === 'users' ? (
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
              <TableCell className="font-medium">
                {log.file_name || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {log.imported_at 
                  ? format(new Date(log.imported_at), "d MMM yyyy 'às' HH:mm", { locale: pt })
                  : '-'
                }
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="success" className="min-w-[2rem] justify-center">
                  +{log.created_count || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary" className="min-w-[2rem] justify-center">
                  ~{log.updated_count || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="min-w-[2rem] justify-center">
                  -{log.deactivated_count || 0}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
