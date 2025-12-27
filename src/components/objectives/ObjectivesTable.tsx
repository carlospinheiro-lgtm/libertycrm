import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { Objective } from '@/types';
import { toast } from 'sonner';

interface ObjectivesTableProps {
  objectives: Objective[];
  onViewDetails: (objective: Objective) => void;
}

function formatValue(value: number, type: string, unit: string): string {
  if (type === 'currency') {
    return `${unit}${value.toLocaleString('pt-PT')}`;
  }
  if (type === 'percentage') {
    return `${value}${unit}`;
  }
  if (unit) {
    return `${value.toLocaleString('pt-PT')} ${unit}`;
  }
  return value.toLocaleString('pt-PT');
}

function getStatusBadge(percentage: number) {
  if (percentage >= 90) {
    return { label: 'No alvo', variant: 'success' as const };
  }
  if (percentage >= 70) {
    return { label: 'Em curso', variant: 'warning' as const };
  }
  return { label: 'Atenção', variant: 'destructive' as const };
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '[&>div]:bg-success';
  if (percentage >= 70) return '[&>div]:bg-warning';
  return '[&>div]:bg-destructive';
}

export function ObjectivesTable({ objectives, onViewDetails }: ObjectivesTableProps) {
  const handleEdit = (objective: Objective) => {
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleDelete = (objective: Objective) => {
    toast.info('Funcionalidade de eliminar em desenvolvimento');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-heading">Lista de Objetivos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objetivo</TableHead>
                <TableHead className="text-right">Alvo</TableHead>
                <TableHead className="text-right">Atual</TableHead>
                <TableHead className="w-[180px]">Progresso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectives.map((objective) => {
                const percentage = Math.round((objective.currentValue / objective.targetValue) * 100);
                const status = getStatusBadge(percentage);
                
                return (
                  <TableRow 
                    key={objective.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewDetails(objective)}
                  >
                    <TableCell className="font-medium">{objective.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatValue(objective.targetValue, objective.type, objective.unit)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatValue(objective.currentValue, objective.type, objective.unit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 flex-1 ${getProgressColor(percentage)}`} 
                        />
                        <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onViewDetails(objective)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(objective)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(objective)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
