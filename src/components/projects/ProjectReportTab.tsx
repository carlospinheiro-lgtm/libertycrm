import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, FileSpreadsheet, FileText, Calendar } from 'lucide-react';
import { useProjectFinancials } from '@/hooks/useProjectFinancials';
import { useProjectStats } from '@/hooks/useProjects';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface ProjectReportTabProps {
  projectId: string;
  projectName: string;
}

export function ProjectReportTab({ projectId, projectName }: ProjectReportTabProps) {
  const { data: financials, isLoading } = useProjectFinancials(projectId);
  const { data: stats } = useProjectStats(projectId);

  // Agrupar por categoria
  const categoryBreakdown = useMemo(() => {
    if (!financials) return { revenues: [], costs: [] };

    const revenuesByCategory = new Map<string, { planned: number; actual: number }>();
    const costsByCategory = new Map<string, { planned: number; actual: number }>();

    financials.forEach(item => {
      const map = item.type === 'revenue' ? revenuesByCategory : costsByCategory;
      const existing = map.get(item.category) || { planned: 0, actual: 0 };
      map.set(item.category, {
        planned: existing.planned + Number(item.planned_value || 0),
        actual: existing.actual + Number(item.actual_value || 0),
      });
    });

    return {
      revenues: Array.from(revenuesByCategory.entries()).map(([category, values]) => ({
        category,
        ...values,
      })),
      costs: Array.from(costsByCategory.entries()).map(([category, values]) => ({
        category,
        ...values,
      })),
    };
  }, [financials]);

  // Top 5 custos
  const topCosts = useMemo(() => {
    if (!financials) return [];
    return financials
      .filter(f => f.type === 'cost')
      .sort((a, b) => Number(b.actual_value || 0) - Number(a.actual_value || 0))
      .slice(0, 5);
  }, [financials]);

  // Timeline de pagamentos/recebimentos
  const paymentsTimeline = useMemo(() => {
    if (!financials) return [];
    return financials
      .filter(f => (f.status === 'paid' || f.status === 'received') && f.date_real)
      .sort((a, b) => new Date(b.date_real!).getTime() - new Date(a.date_real!).getTime())
      .slice(0, 10);
  }, [financials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleExportExcel = () => {
    if (!financials || !stats) return;

    // Preparar dados
    const summaryData = [
      ['Relatório P&L - ' + projectName],
      ['Data:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: pt })],
      [''],
      ['RESUMO'],
      ['', 'Previsto', 'Real'],
      ['Receitas', stats.plannedRevenue, stats.actualRevenue],
      ['Custos', stats.plannedCost, stats.actualCost],
      ['Resultado', stats.plannedResult, stats.actualResult],
      [''],
      ['DETALHES'],
    ];

    const detailHeaders = ['Tipo', 'Rubrica', 'Descrição', 'Previsto', 'Real', 'Estado', 'Data Prevista', 'Data Real'];
    const detailData = financials.map(f => [
      f.type === 'revenue' ? 'Receita' : 'Custo',
      f.category,
      f.description || '',
      f.planned_value,
      f.actual_value,
      f.status,
      f.date_expected || '',
      f.date_real || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...summaryData, detailHeaders, ...detailData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório P&L');
    XLSX.writeFile(wb, `${projectName.replace(/\s+/g, '_')}_PL_Report.xlsx`);
  };

  const handleExportPDF = () => {
    // Para PDF, vamos usar a funcionalidade de impressão do browser
    window.print();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar relatório...</div>;
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Botões de exportação */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Resumo P&L Principal */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle className="text-xl">Resumo P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead className="text-right">Previsto</TableHead>
                  <TableHead className="text-right">Real</TableHead>
                  <TableHead className="text-right">Desvio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Receitas
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(stats?.plannedRevenue || 0)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(stats?.actualRevenue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency((stats?.actualRevenue || 0) - (stats?.plannedRevenue || 0))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Custos
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(stats?.plannedCost || 0)}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(stats?.actualCost || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency((stats?.actualCost || 0) - (stats?.plannedCost || 0))}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold text-lg">Resultado</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(stats?.plannedResult || 0)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-bold text-lg",
                    (stats?.actualResult || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(stats?.actualResult || 0)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    ((stats?.actualResult || 0) - (stats?.plannedResult || 0)) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency((stats?.actualResult || 0) - (stats?.plannedResult || 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grid com detalhes por rubrica */}
      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        {/* Receitas por Rubrica */}
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Receitas por Rubrica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.revenues.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem receitas</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubrica</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.revenues.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.planned)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.actual)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Custos por Rubrica */}
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Custos por Rubrica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.costs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem custos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rubrica</TableHead>
                    <TableHead className="text-right">Previsto</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.costs.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.planned)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.actual)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Custos */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Custos</CardTitle>
        </CardHeader>
        <CardContent>
          {topCosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Sem custos registados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Rubrica</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor Real</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCosts.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.actual_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Timeline de Pagamentos/Recebimentos */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Movimentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsTimeline.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Sem movimentos registados</p>
          ) : (
            <div className="space-y-3">
              {paymentsTimeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.type === 'revenue' ? "bg-green-500" : "bg-red-500"
                    )} />
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.date_real && format(new Date(item.date_real), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.type === 'revenue' ? 'default' : 'secondary'}>
                      {item.status === 'received' ? 'Recebido' : 'Pago'}
                    </Badge>
                    <p className={cn(
                      "font-semibold mt-1",
                      item.type === 'revenue' ? "text-green-600" : "text-red-600"
                    )}>
                      {item.type === 'revenue' ? '+' : '-'}{formatCurrency(item.actual_value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
