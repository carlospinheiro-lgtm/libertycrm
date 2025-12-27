import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Tag } from 'lucide-react';
import { Source, sourceCategoryLabels, sourceFlowLabels } from '@/types';

interface SourcesTableProps {
  sources: Source[];
  onEdit: (source: Source) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  posicionamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  referencias: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  espontaneo: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const flowColors: Record<string, string> = {
  vendedores: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  compradores: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  ambos: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function SourcesTable({ sources, onEdit, onDelete, onToggleActive }: SourcesTableProps) {
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem a certeza que deseja eliminar a origem "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Lista de Origens ({sources.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Fluxo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma origem encontrada
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={flowColors[source.flow]}>
                      {sourceFlowLabels[source.flow]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[source.category]}>
                      {sourceCategoryLabels[source.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.isActive}
                        onCheckedChange={() => onToggleActive(source.id)}
                      />
                      <span className={source.isActive ? 'text-green-600' : 'text-muted-foreground'}>
                        {source.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEdit(source)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(source.id, source.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
