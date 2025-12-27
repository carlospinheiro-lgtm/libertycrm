import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Objective, getObjectiveTypeName, objectiveFlowLabels } from '@/types';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileObjectiveCard } from './MobileObjectiveCard';

interface ResultsTableProps {
  objectives: Objective[];
  onViewDetails?: (objective: Objective) => void;
}

export function ResultsTable({ objectives, onViewDetails }: ResultsTableProps) {
  const isMobile = useIsMobile();
  
  // Filter only result objectives
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Concluído</Badge>;
    }
    if (percentage >= 90) {
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">🟢 {percentage.toFixed(0)}%</Badge>;
    }
    if (percentage >= 70) {
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">🟡 {percentage.toFixed(0)}%</Badge>;
    }
    return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">🔴 {percentage.toFixed(0)}%</Badge>;
  };
  
  const formatValue = (value: number, objective: Objective) => {
    if (objective.unit === 'currency') {
      return new Intl.NumberFormat('pt-PT', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(value);
    }
    return value.toString();
  };
  
  const getFlowBadgeColor = (flow: string) => {
    switch (flow) {
      case 'vendedores':
        return 'bg-blue-500/10 text-blue-600';
      case 'compradores':
        return 'bg-purple-500/10 text-purple-600';
      case 'recrutamento':
        return 'bg-teal-500/10 text-teal-600';
      case 'intermediacao_credito':
        return 'bg-orange-500/10 text-orange-600';
      case 'geral':
        return 'bg-gray-500/10 text-gray-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (resultObjectives.length === 0) {
    return null;
  }

  // Mobile: Use cards instead of table
  if (isMobile) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
          <ClipboardList className="h-4 w-4" />
          Objetivos de Resultado ({resultObjectives.length})
        </h3>
        {resultObjectives.map((objective) => (
          <MobileObjectiveCard
            key={objective.id}
            objective={objective}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Objetivos de Resultado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fluxo</TableHead>
                <TableHead className="text-right">Definido</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Falta</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultObjectives.map((objective) => {
                const percentage = (objective.currentValue / objective.targetValue) * 100;
                const falta = Math.max(0, objective.targetValue - objective.currentValue);
                
                return (
                  <TableRow 
                    key={objective.id}
                    className={cn("cursor-pointer hover:bg-muted/50", onViewDetails && "cursor-pointer")}
                    onClick={() => onViewDetails?.(objective)}
                  >
                    <TableCell className="font-medium">
                      {getObjectiveTypeName(objective)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-xs", getFlowBadgeColor(objective.flow))}>
                        {objectiveFlowLabels[objective.flow]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatValue(objective.targetValue, objective)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatValue(objective.currentValue, objective)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-muted-foreground">
                      {falta > 0 ? formatValue(falta, objective) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(percentage)}
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
