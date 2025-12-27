import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Pencil, Archive, MoreHorizontal, Activity, Trophy } from 'lucide-react';
import { Objective, ObjectiveFlow, ObjectiveCategory, getObjectiveTypeName, objectiveFlowLabels, objectiveCategoryLabels } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface AllObjectivesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: Objective[];
  onViewDetails: (objective: Objective) => void;
}

type StatusFilter = 'all' | 'on_track' | 'in_progress' | 'attention';

const getStatusInfo = (percentage: number): { label: string; variant: 'default' | 'secondary' | 'destructive'; status: StatusFilter } => {
  if (percentage >= 90) return { label: 'No alvo', variant: 'default', status: 'on_track' };
  if (percentage >= 70) return { label: 'Em curso', variant: 'secondary', status: 'in_progress' };
  return { label: 'Atenção', variant: 'destructive', status: 'attention' };
};

const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-emerald-500';
  if (percentage >= 70) return 'bg-amber-500';
  return 'bg-red-500';
};

export function AllObjectivesDialog({ open, onOpenChange, objectives, onViewDetails }: AllObjectivesDialogProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [flowFilter, setFlowFilter] = useState<ObjectiveFlow | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ObjectiveCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredObjectives = useMemo(() => {
    return objectives.filter(obj => {
      // Search filter
      const typeName = getObjectiveTypeName(obj).toLowerCase();
      if (searchQuery && !typeName.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Flow filter
      if (flowFilter !== 'all' && obj.flow !== flowFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && obj.objectiveCategory !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const percentage = obj.targetValue > 0 ? (obj.currentValue / obj.targetValue) * 100 : 0;
        const statusInfo = getStatusInfo(percentage);
        if (statusInfo.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [objectives, searchQuery, flowFilter, categoryFilter, statusFilter]);

  const handleEdit = (objective: Objective) => {
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleArchive = (objective: Objective) => {
    toast.success(`Objetivo "${getObjectiveTypeName(objective)}" arquivado`);
  };

  const formatValue = (value: number, unit: string, unitSymbol: string): string => {
    if (unit === 'currency') {
      return `${value.toLocaleString('pt-PT')}${unitSymbol}`;
    }
    return `${value}${unitSymbol}`;
  };

  const formatPeriod = (startDate: Date, endDate: Date): string => {
    return `${format(startDate, 'dd/MM', { locale: pt })} - ${format(endDate, 'dd/MM/yy', { locale: pt })}`;
  };

  const renderContent = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={flowFilter} onValueChange={(v) => setFlowFilter(v as ObjectiveFlow | 'all')}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Fluxo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Fluxos</SelectItem>
              <SelectItem value="vendedores">Vendedores</SelectItem>
              <SelectItem value="compradores">Compradores</SelectItem>
              <SelectItem value="recrutamento">Recrutamento</SelectItem>
              <SelectItem value="intermediacao_credito">Int. Crédito</SelectItem>
              <SelectItem value="geral">Geral</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ObjectiveCategory | 'all')}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="activity">Atividade</SelectItem>
              <SelectItem value="result">Resultado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="on_track">No alvo</SelectItem>
              <SelectItem value="in_progress">Em curso</SelectItem>
              <SelectItem value="attention">Atenção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="h-[400px] md:h-[500px]">
        {isMobile ? (
          // Mobile Cards View
          <div className="space-y-3">
            {filteredObjectives.map((objective) => {
              const percentage = objective.targetValue > 0 
                ? Math.round((objective.currentValue / objective.targetValue) * 100) 
                : 0;
              const statusInfo = getStatusInfo(percentage);
              const isActivity = objective.objectiveCategory === 'activity';

              return (
                <div 
                  key={objective.id} 
                  className="border rounded-lg p-3 space-y-2 bg-card"
                  onClick={() => onViewDetails(objective)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isActivity ? (
                        <Activity className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Trophy className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="font-medium text-sm">{getObjectiveTypeName(objective)}</span>
                    </div>
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {objectiveFlowLabels[objective.flow]}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${isActivity ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                    >
                      {isActivity ? 'Atividade' : 'Resultado'}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatPeriod(new Date(objective.startDate), new Date(objective.endDate))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {formatValue(objective.currentValue, objective.unit, objective.unitSymbol)} / {formatValue(objective.targetValue, objective.unit, objective.unitSymbol)}
                    </span>
                    <span className="font-medium">{percentage}%</span>
                  </div>

                  <Progress value={percentage} className={`h-1.5 ${getProgressColor(percentage)}`} />
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop Table View
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Fluxo</TableHead>
                <TableHead className="w-[90px]">Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-[110px]">Período</TableHead>
                <TableHead className="w-[80px] text-right">Alvo</TableHead>
                <TableHead className="w-[80px] text-right">Real.</TableHead>
                <TableHead className="w-[100px]">Progresso</TableHead>
                <TableHead className="w-[80px]">Estado</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObjectives.map((objective) => {
                const percentage = objective.targetValue > 0 
                  ? Math.round((objective.currentValue / objective.targetValue) * 100) 
                  : 0;
                const statusInfo = getStatusInfo(percentage);
                const isActivity = objective.objectiveCategory === 'activity';

                return (
                  <TableRow key={objective.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {objectiveFlowLabels[objective.flow]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isActivity ? (
                          <Activity className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span className={`text-xs ${isActivity ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {isActivity ? 'Ativ.' : 'Res.'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {getObjectiveTypeName(objective)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPeriod(new Date(objective.startDate), new Date(objective.endDate))}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatValue(objective.targetValue, objective.unit, objective.unitSymbol)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatValue(objective.currentValue, objective.unit, objective.unitSymbol)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className={`h-1.5 flex-1 ${getProgressColor(percentage)}`} />
                        <span className="text-xs font-medium w-8 text-right">{percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(objective)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Abrir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(objective)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(objective)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        Mostrando {filteredObjectives.length} de {objectives.length} objetivos
      </div>
    </div>
  );

  // Mobile uses Sheet, Desktop uses Dialog
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              📋 Todos os Objetivos
            </SheetTitle>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Todos os Objetivos Definidos
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}