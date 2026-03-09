import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Eye, TrendingUp, Receipt, Wallet, Clock, Search, ArrowUpDown } from 'lucide-react';
import { useDeals, Deal } from '@/hooks/useDeals';
import { format, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AddDealSheet } from '@/components/processos/AddDealSheet';
import { DealDetailsSheet } from '@/components/processos/DealDetailsSheet';

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: 'Referência', className: 'bg-muted text-muted-foreground' },
  1: { label: 'Faturado', className: 'bg-warning/15 text-warning border-warning/30' },
  2: { label: 'Recebido', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  3: { label: 'Reportado', className: 'bg-primary/15 text-primary border-primary/30' },
};

const TYPE_MAP: Record<string, { label: string; className: string }> = {
  Venda: { label: 'Venda', className: 'bg-primary/15 text-primary border-primary/30' },
  AngariaçãoVenda: { label: 'Ang. Venda', className: 'bg-orange-500/15 text-orange-600 border-orange-500/30' },
  AngariaArrenda: { label: 'Ang. Arrenda', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  Arrenda: { label: 'Arrenda', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
};

type SortField = 'reported_month' | 'sale_value' | 'deal_status';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export default function Processos() {
  const { data: deals = [], isLoading } = useDeals();

  const [newDealOpen, setNewDealOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Sort
  const [sortField, setSortField] = useState<SortField>('reported_month');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(0);

  // Unique months
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    deals.forEach(d => { if (d.reported_month) months.add(d.reported_month); });
    return Array.from(months).sort().reverse();
  }, [deals]);

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonthStr = format(now, 'yyyy-MM');

    const thisMonth = deals.filter(d => {
      if (d.reported_month) return d.reported_month.startsWith(currentMonthStr);
      if (d.created_at) {
        const created = new Date(d.created_at);
        return created >= monthStart && created <= monthEnd;
      }
      return false;
    });

    return {
      countThisMonth: thisMonth.length,
      totalInvoiced: deals.reduce((sum, d) => sum + (d.invoice_value || 0), 0),
      totalCommission: deals.reduce((sum, d) => sum + (d.commission_store || 0), 0),
      pendingPayment: deals.filter(d => (d.deal_status ?? 0) < 2).length,
    };
  }, [deals]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...deals];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        (d.pv_number || '').toLowerCase().includes(q) ||
        (d.consultant_name || '').toLowerCase().includes(q) ||
        (d.address || '').toLowerCase().includes(q) ||
        (d.buyer_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(d => String(d.deal_status ?? 0) === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(d => d.deal_type === typeFilter);
    }

    if (monthFilter !== 'all') {
      result = result.filter(d => d.reported_month === monthFilter);
    }

    // Sort
    result.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'reported_month') { av = a.reported_month || ''; bv = b.reported_month || ''; }
      else if (sortField === 'sale_value') { av = a.sale_value ?? 0; bv = b.sale_value ?? 0; }
      else if (sortField === 'deal_status') { av = a.deal_status ?? 0; bv = b.deal_status ?? 0; }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [deals, search, statusFilter, typeFilter, monthFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const isOverdue = (d: Deal) => {
    if (!d.deed_date) return false;
    return isBefore(new Date(d.deed_date), new Date()) && (d.deal_status ?? 0) < 2;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">CRM Processual</h1>
              <p className="text-muted-foreground text-sm">Gestão de processos de venda e faturação</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Processos este mês" value={String(kpis.countThisMonth)} loading={isLoading} />
          <KpiCard icon={<Receipt className="h-4 w-4" />} label="Faturação total (€)" value={formatCurrency(kpis.totalInvoiced)} loading={isLoading} />
          <KpiCard icon={<Wallet className="h-4 w-4" />} label="Comissão recebida (€)" value={formatCurrency(kpis.totalCommission)} loading={isLoading} />
          <KpiCard icon={<Clock className="h-4 w-4" />} label="Pendentes de pagamento" value={String(kpis.pendingPayment)} loading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar PV, consultor, morada, comprador…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="0">Referência</SelectItem>
              <SelectItem value="1">Faturado</SelectItem>
              <SelectItem value="2">Recebido</SelectItem>
              <SelectItem value="3">Reportado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="AngariaçãoVenda">Ang. Venda</SelectItem>
              <SelectItem value="AngariaArrenda">Ang. Arrenda</SelectItem>
              <SelectItem value="Arrenda">Arrenda</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={v => { setMonthFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueMonths.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2 ml-auto" onClick={() => setNewDealOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Processo
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Sem processos</h3>
                <p className="text-muted-foreground text-sm mb-4">Ainda não existem processos registados.</p>
                <Button className="gap-2" onClick={() => setNewDealOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Adicionar primeiro processo
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader label="Mês" field="reported_month" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <TableHead>Nº PV</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Morada</TableHead>
                        <SortableHeader label="Valor Venda" field="sale_value" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <TableHead>Comissão Loja</TableHead>
                        <SortableHeader label="Estado" field="deal_status" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <TableHead>Escritura</TableHead>
                        <TableHead>Recebimento</TableHead>
                        <TableHead className="w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map(deal => (
                        <TableRow
                          key={deal.id}
                          className={isOverdue(deal) ? 'bg-destructive/5 hover:bg-destructive/10' : ''}
                        >
                          <TableCell className="font-medium text-sm">{deal.reported_month || '—'}</TableCell>
                          <TableCell className="text-sm">{deal.pv_number || '—'}</TableCell>
                          <TableCell>
                            {deal.deal_type && TYPE_MAP[deal.deal_type] ? (
                              <Badge variant="outline" className={TYPE_MAP[deal.deal_type].className}>
                                {TYPE_MAP[deal.deal_type].label}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">{deal.deal_type || '—'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{deal.consultant_name || '—'}</TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{deal.address || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(deal.sale_value)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(deal.commission_store)}</TableCell>
                          <TableCell>
                            {(() => {
                              const s = STATUS_MAP[deal.deal_status ?? 0] || STATUS_MAP[0];
                              return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
                            })()}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(deal.deed_date)}</TableCell>
                          <TableCell className="text-sm">{formatDate(deal.received_date)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDeal(deal)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} · Página {page + 1} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Seguinte</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-6 w-16 mb-1" />
          ) : (
            <p className="text-lg font-bold truncate">{value}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableHeader({ label, field, current, dir, onSort }: { label: string; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void }) {
  const isActive = current === field;
  return (
    <TableHead>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </button>
    </TableHead>
  );
}
