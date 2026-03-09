import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeals, Deal, useUpdateDeal } from '@/hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useConsultants } from '@/hooks/useConsultants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Wallet, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

import { calculateCommission } from '@/lib/commissionCalc';
import type { Consultant } from '@/hooks/useConsultants';

interface ConsultantInfo {
  tier: string | null;
  commission_pct: number | null;
  commission_system: string | null;
  has_company: boolean | null;
  accumulated_12m: number | null;
  is_team_member: boolean | null;
}

function getCommission(d: Deal, consultantMap: Map<string, ConsultantInfo>): number {
  // Priority 1: already stored (Maxwork deals)
  if (d.consultant_commission && d.consultant_commission > 0) return d.consultant_commission;
  // Priority 2: recalculate if we have enough data
  if (d.sale_value && d.commission_pct && d.consultant_name) {
    const info = consultantMap.get(d.consultant_name.toLowerCase());
    if (info) {
      const result = calculateCommission({
        saleValue: d.sale_value,
        commissionPct: d.commission_pct,
        sideFraction: d.side_fraction ?? 0.5,
        referralPct: d.referral_pct ?? 0,
        consultant: {
          commission_system: info.commission_system,
          has_company: info.has_company,
          accumulated_12m: info.accumulated_12m,
          is_team_member: info.is_team_member,
        },
      });
      return result.agentAmount;
    }
  }
  // Priority 3: fallback
  return (d.commission_store || 0) * 0.47;
}

interface ConsultantRow {
  name: string;
  deals: Deal[];
  processCount: number;
  grossCommission: number;
  expenseDiscount: number;
  netCommission: number;
  isPaid: boolean;
  paidDate: string | null;
  tier: string | null;
  commissionPct: number | null;
}

export default function Pagamentos() {
  const { data: deals = [], isLoading } = useDeals();
  const { currentUser } = useAuth();
  const agencyId = currentUser?.agencyId;
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [extratoConsultant, setExtratoConsultant] = useState<ConsultantRow | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Fetch consultants for tier/commission info
  const { data: consultants = [] } = useConsultants();

  const consultantMap = useMemo(() => {
    const map = new Map<string, ConsultantInfo>();
    consultants.forEach(c => {
      map.set(c.name.toLowerCase(), {
        tier: c.tier,
        commission_pct: c.commission_pct,
        commission_system: c.commission_system,
        has_company: c.has_company,
        accumulated_12m: c.accumulated_12m,
        is_team_member: c.is_team_member,
      });
    });
    return map;
  }, [consultants]);

  const months = useMemo(() => {
    const set = new Set<string>();
    deals.forEach(d => {
      if (d.reported_month) set.add(d.reported_month);
    });
    return Array.from(set).sort().reverse();
  }, [deals]);

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
      const grossCommission = consultantDeals.reduce((s, d) => s + getCommission(d, consultantMap), 0);
      const expenseDiscount = consultantDeals.reduce((s, d) => s + (d.expense_discount || 0), 0);
      const isPaid = consultantDeals.length > 0 && consultantDeals.every(d => !!d.consultant_paid_date);
      const paidDates = consultantDeals.filter(d => d.consultant_paid_date).map(d => d.consultant_paid_date!);
      const paidDate = paidDates.length > 0 ? paidDates.sort().reverse()[0] : null;
      const info = consultantMap.get(name.toLowerCase());

      rows.push({
        name,
        deals: consultantDeals,
        processCount: consultantDeals.length,
        grossCommission,
        expenseDiscount,
        netCommission: grossCommission - expenseDiscount,
        isPaid,
        paidDate,
        tier: info?.tier ?? null,
        commissionPct: info?.commission_pct ?? null,
      });
    });

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [deals, selectedMonth, consultantMap]);

  const totals = useMemo(() => ({
    processes: consultantRows.reduce((s, r) => s + r.processCount, 0),
    gross: consultantRows.reduce((s, r) => s + r.grossCommission, 0),
    discount: consultantRows.reduce((s, r) => s + r.expenseDiscount, 0),
    net: consultantRows.reduce((s, r) => s + r.netCommission, 0),
  }), [consultantRows]);

  const handleMarkPaid = async (row: ConsultantRow) => {
    setMarkingPaid(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const unpaidDeals = row.deals.filter(d => !d.consultant_paid_date);
      for (const deal of unpaidDeals) {
        const { error } = await supabase
          .from('deals')
          .update({ consultant_paid_date: today } as any)
          .eq('id', deal.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('✅ Pagamento registado');
      setExtratoConsultant(null);
    } catch (e: any) {
      toast.error('Erro ao registar pagamento: ' + e.message);
    } finally {
      setMarkingPaid(false);
    }
  };

  const today = new Date().toLocaleDateString('pt-PT');

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
                  <TableHead className="text-center">Estado</TableHead>
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
                    <TableCell className="text-center">
                      {row.isPaid ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Pago {row.paidDate}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
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
            <SheetTitle className="sr-only">Extrato</SheetTitle>
          </SheetHeader>

          {extratoConsultant && (
            <>
              {/* Enhanced header */}
              <div className="space-y-3 mb-6">
                <h2 className="text-xl font-bold text-foreground">{extratoConsultant.name}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {extratoConsultant.tier && (
                    <Badge variant="outline">Escalão {extratoConsultant.tier}</Badge>
                  )}
                  <Badge variant="secondary">
                    {extratoConsultant.commissionPct ? `${extratoConsultant.commissionPct}%` : '47% (padrão)'}
                  </Badge>
                  <Badge variant="outline">{extratoConsultant.processCount} processos</Badge>
                  {selectedMonth !== 'all' && (
                    <Badge variant="outline">{selectedMonth}</Badge>
                  )}
                </div>
              </div>

              {/* Deals table */}
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
                  {extratoConsultant.deals.map(d => {
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
                    <TableCell className="text-right">{formatCurrency(extratoConsultant.grossCommission)}</TableCell>
                    <TableCell className="text-right text-destructive">{extratoConsultant.expenseDiscount > 0 ? formatCurrency(extratoConsultant.expenseDiscount) : '—'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(extratoConsultant.netCommission)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Mark as Paid button */}
              <div className="mt-6 flex justify-end">
                {extratoConsultant.isPaid ? (
                  <Button disabled className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Já pago
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="gap-2" disabled={markingPaid}>
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar Pago ao Consultor
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Confirmar pagamento de {formatCurrency(extratoConsultant.netCommission)} a {extratoConsultant.name} em {today}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleMarkPaid(extratoConsultant)} disabled={markingPaid}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
