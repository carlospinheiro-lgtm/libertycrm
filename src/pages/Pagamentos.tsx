import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeals, Deal } from '@/hooks/useDeals';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Wallet } from 'lucide-react';

function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

function getCommission(d: Deal): number {
  if (d.consultant_commission && d.consultant_commission > 0) return d.consultant_commission;
  return (d.commission_store || 0) * 0.47;
}

interface ConsultantRow {
  name: string;
  deals: Deal[];
  processCount: number;
  grossCommission: number;
  expenseDiscount: number;
  netCommission: number;
}

export default function Pagamentos() {
  const { data: deals = [], isLoading } = useDeals();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [extratoConsultant, setExtratoConsultant] = useState<ConsultantRow | null>(null);

  // Extract unique months from deals
  const months = useMemo(() => {
    const set = new Set<string>();
    deals.forEach(d => {
      if (d.reported_month) set.add(d.reported_month);
    });
    return Array.from(set).sort().reverse();
  }, [deals]);

  // Filter deals by month and group by consultant
  const consultantRows = useMemo(() => {
    const filtered = selectedMonth === 'all'
      ? deals
      : deals.filter(d => d.reported_month === selectedMonth);

    const map = new Map<string, Deal[]>();
    filtered.forEach(d => {
      const name = d.consultant_name || 'Sem Consultor';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(d);
    });

    const rows: ConsultantRow[] = [];
    map.forEach((consultantDeals, name) => {
      const grossCommission = consultantDeals.reduce((s, d) => s + getCommission(d), 0);
      const expenseDiscount = consultantDeals.reduce((s, d) => s + (d.expense_discount || 0), 0);
      rows.push({
        name,
        deals: consultantDeals,
        processCount: consultantDeals.length,
        grossCommission,
        expenseDiscount,
        netCommission: grossCommission - expenseDiscount,
      });
    });

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [deals, selectedMonth]);

  const totals = useMemo(() => ({
    processes: consultantRows.reduce((s, r) => s + r.processCount, 0),
    gross: consultantRows.reduce((s, r) => s + r.grossCommission, 0),
    discount: consultantRows.reduce((s, r) => s + r.expenseDiscount, 0),
    net: consultantRows.reduce((s, r) => s + r.netCommission, 0),
  }), [consultantRows]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">A carregar...</div>
        ) : consultantRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Sem dados para o período selecionado</div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultor</TableHead>
                  <TableHead className="text-center">Nº Processos</TableHead>
                  <TableHead className="text-right">Comissão Bruta</TableHead>
                  <TableHead className="text-right">Desconto Despesas</TableHead>
                  <TableHead className="text-right">Comissão Líquida</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultantRows.map(row => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-center">{row.processCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.grossCommission)}</TableCell>
                    <TableCell className="text-right text-destructive">{row.expenseDiscount > 0 ? formatCurrency(row.expenseDiscount) : '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.netCommission)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setExtratoConsultant(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{totals.processes}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.gross)}</TableCell>
                  <TableCell className="text-right text-destructive">{totals.discount > 0 ? formatCurrency(totals.discount) : '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.net)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Extrato Sheet */}
      <Sheet open={!!extratoConsultant} onOpenChange={open => !open && setExtratoConsultant(null)}>
        <SheetContent className="w-full sm:max-w-[720px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Extrato — {extratoConsultant?.name}
              <Badge variant="outline" className="ml-2">{extratoConsultant?.processCount} processos</Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PV</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Venda</TableHead>
                  <TableHead className="text-right">Comissão Consultor</TableHead>
                  <TableHead className="text-right">Desconto Despesas</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extratoConsultant?.deals.map(d => {
                  const commission = getCommission(d);
                  const discount = d.expense_discount || 0;
                  const hasDiscount = (d.discount_pct ?? 0) > 0;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.pv_number || '—'}</TableCell>
                      <TableCell>{d.deal_type || '—'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.sale_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(commission)}</TableCell>
                      <TableCell className="text-right text-destructive">{hasDiscount ? formatCurrency(discount) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(commission - discount)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(extratoConsultant?.grossCommission ?? 0)}</TableCell>
                  <TableCell className="text-right text-destructive">{(extratoConsultant?.expenseDiscount ?? 0) > 0 ? formatCurrency(extratoConsultant?.expenseDiscount ?? 0) : '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(extratoConsultant?.netCommission ?? 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
