import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Send, Archive, Edit, Trash2 } from 'lucide-react';
import { useProjectFinancials, useUpdateFinancialStatus, useDeleteFinancialItem } from '@/hooks/useProjectFinancials';
import { AddFinancialItemDialog } from './AddFinancialItemDialog';
import { EditFinancialItemDialog } from './EditFinancialItemDialog';
import { 
  ProjectFinancialItem,
  FinancialItemType, 
  FinancialItemStatus,
  financialItemStatusLabels, 
  financialItemStatusColors,
  ProjectMemberRole
} from '@/types/projects';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProjectBudgetTabProps {
  projectId: string;
  canEdit: boolean;
  canManageFinance: boolean;
  userRole?: ProjectMemberRole | null;
}

export function ProjectBudgetTab({ projectId, canEdit, canManageFinance, userRole }: ProjectBudgetTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<FinancialItemType>('cost');
  const [editItem, setEditItem] = useState<ProjectFinancialItem | null>(null);
  
  const { data: financials, isLoading } = useProjectFinancials(projectId);
  const updateStatus = useUpdateFinancialStatus();
  const deleteItem = useDeleteFinancialItem();

  // Separar receitas e custos
  const revenues = useMemo(() => 
    financials?.filter(f => f.type === 'revenue') || [], 
    [financials]
  );
  
  const costs = useMemo(() => 
    financials?.filter(f => f.type === 'cost') || [], 
    [financials]
  );

  // Calcular totais
  const totals = useMemo(() => {
    const plannedRevenue = revenues.reduce((acc, r) => acc + Number(r.planned_value || 0), 0);
    const actualRevenue = revenues.reduce((acc, r) => acc + Number(r.actual_value || 0), 0);
    const plannedCost = costs.reduce((acc, c) => acc + Number(c.planned_value || 0), 0);
    const actualCost = costs.reduce((acc, c) => acc + Number(c.actual_value || 0), 0);
    
    return {
      plannedRevenue,
      actualRevenue,
      plannedCost,
      actualCost,
      plannedResult: plannedRevenue - plannedCost,
      actualResult: actualRevenue - actualCost,
      isOverBudget: actualCost > plannedCost,
    };
  }, [revenues, costs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleStatusChange = (id: string, status: FinancialItemStatus) => {
    updateStatus.mutate({ 
      id, 
      projectId, 
      status,
      date_real: (status === 'paid' || status === 'received') ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este item?')) {
      deleteItem.mutate({ id, projectId });
    }
  };

  const handleAddItem = (type: FinancialItemType) => {
    setAddType(type);
    setAddDialogOpen(true);
  };

  const renderFinancialTable = (items: ProjectFinancialItem[], type: FinancialItemType) => {
    const isRevenue = type === 'revenue';
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {isRevenue ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            {isRevenue ? 'Receitas' : 'Custos'}
            <Badge variant="secondary" className="ml-2">{items.length}</Badge>
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => handleAddItem(type)}>
              <Plus className="h-4 w-4 mr-1" />
              {isRevenue ? 'Nova Receita' : 'Novo Custo'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum{isRevenue ? 'a receita' : ' custo'} registado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubrica</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data Prev.</TableHead>
                    <TableHead>Data Real</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.planned_value)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.actual_value)}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', financialItemStatusColors[item.status as FinancialItemStatus])}>
                          {financialItemStatusLabels[item.status as FinancialItemStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.date_expected ? format(new Date(item.date_expected), 'dd/MM/yyyy', { locale: pt }) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.date_real ? format(new Date(item.date_real), 'dd/MM/yyyy', { locale: pt }) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.responsible_user ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">
                                {item.responsible_user.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{item.responsible_user.name}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => setEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            
                            {/* Ações de status baseadas no estado atual e permissões */}
                            {item.status === 'planned' && canEdit && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'submitted')}>
                                <Send className="h-4 w-4 mr-2" />
                                Submeter
                              </DropdownMenuItem>
                            )}
                            
                            {item.status === 'submitted' && canManageFinance && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'approved')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar
                              </DropdownMenuItem>
                            )}
                            
                            {item.status === 'approved' && canManageFinance && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, isRevenue ? 'received' : 'paid')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar {isRevenue ? 'Recebido' : 'Pago'}
                              </DropdownMenuItem>
                            )}
                            
                            {(item.status === 'paid' || item.status === 'received') && canManageFinance && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'archived')}>
                                <Archive className="h-4 w-4 mr-2" />
                                Arquivar
                              </DropdownMenuItem>
                            )}

                            {canManageFinance && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(item.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar orçamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo P&L */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Receitas</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Previsto</p>
                <p className="text-sm md:text-base lg:text-lg font-semibold truncate">{formatCurrency(totals.plannedRevenue)}</p>
              </div>
              <div className="text-left sm:text-right">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 opacity-50 hidden sm:block" />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Real</p>
                <p className="text-sm md:text-base lg:text-lg font-bold text-green-600 truncate">{formatCurrency(totals.actualRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Custos</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Previsto</p>
                <p className="text-sm md:text-base lg:text-lg font-semibold truncate">{formatCurrency(totals.plannedCost)}</p>
              </div>
              <div className="text-left sm:text-right">
                <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-500 opacity-50 hidden sm:block" />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Real</p>
                <p className="text-sm md:text-base lg:text-lg font-bold text-red-600 truncate">{formatCurrency(totals.actualCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resultado</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Previsto</p>
                <p className="text-sm md:text-base lg:text-lg font-semibold truncate">{formatCurrency(totals.plannedResult)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Real</p>
                <p className={cn(
                  "text-base md:text-lg lg:text-xl font-bold truncate",
                  totals.actualResult >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(totals.actualResult)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(totals.isOverBudget && "border-orange-300 bg-orange-50")}>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-center h-full min-h-[60px]">
              {totals.isOverBudget ? (
                <div className="text-center">
                  <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mx-auto mb-1 md:mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-orange-700">Overbudget</p>
                  <p className="text-[10px] sm:text-xs text-orange-600 truncate">
                    +{formatCurrency(totals.actualCost - totals.plannedCost)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 mx-auto mb-1 md:mb-2" />
                  <p className="text-xs sm:text-sm font-medium text-green-700">Dentro do orçamento</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Receitas e Custos */}
      {renderFinancialTable(revenues, 'revenue')}
      {renderFinancialTable(costs, 'cost')}

      {/* Dialogs */}
      <AddFinancialItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        projectId={projectId}
        type={addType}
      />

      {editItem && (
        <EditFinancialItemDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          item={editItem}
          projectId={projectId}
        />
      )}
    </div>
  );
}
