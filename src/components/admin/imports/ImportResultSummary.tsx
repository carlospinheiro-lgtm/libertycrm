import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, RefreshCcw, XCircle, AlertCircle } from 'lucide-react';
import { ImportResult } from '@/types/import';

interface ImportResultSummaryProps {
  result: ImportResult;
}

export function ImportResultSummary({ result }: ImportResultSummaryProps) {
  const hasErrors = result.errors.length > 0;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-full">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{result.created}</p>
                <p className="text-sm text-muted-foreground">Criados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <RefreshCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{result.updated}</p>
                <p className="text-sm text-muted-foreground">Atualizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-full">
                <XCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{result.deactivated}</p>
                <p className="text-sm text-muted-foreground">Desativados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasErrors && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">
                  {result.errors.length} erro(s) durante a importação
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-muted-foreground/70">
                      ... e mais {result.errors.length - 5} erros
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
