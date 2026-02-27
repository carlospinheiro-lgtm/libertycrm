import { DbPropertyDocument } from '@/hooks/usePropertyDocuments';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface PropertyDocumentsTabProps {
  documents: DbPropertyDocument[];
  onAddDocument: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  caderneta: 'Caderneta Predial',
  certidao: 'Certidão de Teor',
  licenca: 'Licença de Utilização',
  certificado_energetico: 'Certificado Energético',
  identificacao: 'Identificação',
  avaliacao: 'Avaliação',
  contrato: 'Contrato',
  outro: 'Outro',
};

export function PropertyDocumentsTab({ documents, onAddDocument }: PropertyDocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Documentos ({documents.length})</h3>
        <Button size="sm" onClick={onAddDocument}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          Nenhum documento carregado
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => {
            const expiryDays = doc.expiry_date
              ? differenceInDays(new Date(doc.expiry_date), new Date())
              : null;

            return (
              <Card key={doc.id} className="p-3 flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name || 'Documento'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </Badge>
                    <span>v{doc.version}</span>
                    <span>{format(new Date(doc.created_at), 'dd/MM/yyyy')}</span>
                    {expiryDays !== null && (
                      <span className={expiryDays < 30 ? 'text-destructive font-medium' : ''}>
                        Expira: {format(new Date(doc.expiry_date!), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
