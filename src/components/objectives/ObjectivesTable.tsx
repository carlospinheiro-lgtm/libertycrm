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
import { Objective, getObjectiveTypeName, objectiveFlowLabels, objectiveCategoryLabels } from '@/types';
import { toast } from 'sonner';

interface ObjectivesTableProps {
  objectives: Objective[];
  onViewDetails: (objective: Objective) => void;
  title?: string;
}

function formatValue(value: number, unit: string, unitSymbol: string): string {
  if (unit === 'currency') {
    return `${unitSymbol}${value.toLocaleString('pt-PT')}`;
  }
  if (unitSymbol) {
    return `${value.toLocaleString('pt-PT')} ${unitSymbol}`;
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

function getFlowBadgeColor(flow: string): string {
  switch (flow) {
    case 'vendedores':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'compradores':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'geral':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return '';
  }
}

function getCategoryBadgeColor(category: string): string {
  return category === 'activity' 
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
}

export function ObjectivesTable({ objectives, onViewDetails, title = 'Lista de Objetivos' }: ObjectivesTableProps) {
  const handleEdit = (objective: Objective) => {
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleDelete = (objective: Objective) => {
    toast.info('Funcionalidade de eliminar em desenvolvimento');
  };

  if (objectives.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-heading">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fluxo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atribuição</TableHead>
                <TableHead className="text-right">Alvo</TableHead>
                <TableHead className="text-right">Atual</TableHead>
                <TableHead className="w-[140px]">Progresso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objectives.map((objective) => {
                const percentage = Math.round((objective.currentValue / objective.targetValue) * 100);
                const status = getStatusBadge(percentage);
                const typeName = getObjectiveTypeName(objective);
                
                return (
                  <TableRow 
                    key={objective.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onViewDetails(objective)}
                  >
                    <TableCell className="font-medium">{typeName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getFlowBadgeColor(objective.flow)}>
                        {objectiveFlowLabels[objective.flow]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getCategoryBadgeColor(objective.objectiveCategory)}>
                        {objectiveCategoryLabels[objective.objectiveCategory]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {objective.targetName || '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatValue(objective.targetValue, objective.unit, objective.unitSymbol)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatValue(objective.currentValue, objective.unit, objective.unitSymbol)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 flex-1 ${getProgressColor(percentage)}`} 
                        />
                        <span className="text-sm font-medium w-10 text-right">{percentage}%</span>
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