import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, FileText, Receipt, CreditCard, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Deal, useUpdateDeal } from '@/hooks/useDeals';
import { StatusChangeDialog } from './StatusChangeDialog';

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

const STATUS_ACTIONS: Record<number, { label: string; className: string }> = {
  0: { label: 'Registar Nº Fatura', className: 'bg-gray-600 text-white hover:bg-gray-700' },
  1: { label: 'Marcar Recebido', className: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  2: { label: 'Confirmar Pagamento ao Consultor', className: 'bg-blue-600 text-white hover:bg-blue-700' },
};

interface Props {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDetailsSheet({ deal, open, onOpenChange }: Props) {
  const updateDeal = useUpdateDeal();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Tab: Resumo
  const [resumo, setResumo] = useState<Record<string, any>>({});
  // Tab: CPCV
  const [cpcv, setCpcv] = useState<Record<string, any>>({});
  // Tab: Financeiro
  const [fin, setFin] = useState<Record<string, any>>({});
  // Tab: Pagamentos
  const [pag, setPag] = useState<Record<string, any>>({});
  // Tab: Notas
  const [notas, setNotas] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!deal) return;
    setResumo({
      consultant_name: deal.consultant_name || '',
      sale_value: deal.sale_value ?? '',
      commission_pct: deal.commission_pct ?? '',
      commission_store: deal.commission_store ?? '',
      address: deal.address || '',
      municipality: deal.municipality || '',
      process_manager: deal.process_manager || '',
      reported_month: deal.reported_month || '',
      partner_agency: deal.partner_agency || '',
    });
    setCpcv({
      cpcv_date: deal.cpcv_date || '',
      cpcv_pct: deal.cpcv_pct ?? '',
      deed_date: deal.deed_date || '',
      deed_pct: deal.deed_pct ?? '',
      deed_days: deal.deed_days ?? '',
      conditional: deal.conditional || '',
      signal_value: deal.signal_value ?? '',
      signal_returned: deal.signal_returned ?? '',
      docs_missing: deal.docs_missing || '',
    });
    setFin({
      consultant_commission: deal.consultant_commission ?? '',
      commission_store: deal.commission_store ?? '',
      commission_remax: deal.commission_remax ?? '',
      margin: deal.margin ?? '',
      discount_pct: deal.discount_pct ?? '',
      expense_discount: deal.expense_discount ?? '',
      primary_margin: deal.primary_margin ?? '',
      invoice_number: deal.invoice_number || '',
      invoice_date: deal.invoice_date || '',
      invoice_value: deal.invoice_value ?? '',
      invoice_total_vat: deal.invoice_total_vat ?? '',
      invoice_recipient: deal.invoice_recipient || '',
    });
    setPag({
      received_date: deal.received_date || '',
      received_month: deal.received_month || '',
      consultant_paid_date: deal.consultant_paid_date || '',
      partner_paid_date: deal.partner_paid_date || '',
      partner_invoice_number: deal.partner_invoice_number || '',
    });
    setNotas({
      notes: deal.notes || '',
      archive_ref: deal.archive_ref || '',
    });
  }, [deal]);

  if (!deal) return null;

  const status = deal.deal_status ?? 0;
  const statusInfo = STATUS_MAP[status] || STATUS_MAP[0];
  const typeInfo = deal.deal_type ? TYPE_MAP[deal.deal_type] : null;
  const action = STATUS_ACTIONS[status];

  const saveTab = async (fields: Record<string, any>) => {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      cleaned[k] = v === '' ? null : v;
    }
    try {
      await updateDeal.mutateAsync({ id: deal.id, ...cleaned });
      toast.success('Guardado com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[680px] overflow-y-auto p-0">
          {/* Header */}
          <div className="p-6 border-b space-y-3">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold">{deal.pv_number || 'Sem PV'}</span>
                {typeInfo && <Badge variant="outline" className={typeInfo.className}>{typeInfo.label}</Badge>}
                <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
              </SheetTitle>
            </SheetHeader>
            {action && (
              <Button size="sm" className={cn('gap-2', action.className)} onClick={() => setStatusDialogOpen(true)}>
                {action.label}
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="p-6">
            <Tabs defaultValue="resumo">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
                <TabsTrigger value="cpcv" className="text-xs">CPCV</TabsTrigger>
                <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
                <TabsTrigger value="pagamentos" className="text-xs">Pagamentos</TabsTrigger>
                <TabsTrigger value="notas" className="text-xs">Notas</TabsTrigger>
              </TabsList>

              {/* RESUMO */}
              <TabsContent value="resumo" className="space-y-4 mt-4">
                <FieldGrid>
                  <Field label="Consultor" value={resumo.consultant_name} onChange={v => setResumo(p => ({ ...p, consultant_name: v }))} />
                  <Field label="Valor Venda (€)" value={resumo.sale_value} onChange={v => setResumo(p => ({ ...p, sale_value: v }))} type="number" />
                  <Field label="% Comissão" value={resumo.commission_pct} onChange={v => setResumo(p => ({ ...p, commission_pct: v }))} type="number" />
                  <Field label="Comissão Loja (€)" value={resumo.commission_store} onChange={v => setResumo(p => ({ ...p, commission_store: v }))} type="number" />
                  <Field label="Morada" value={resumo.address} onChange={v => setResumo(p => ({ ...p, address: v }))} full />
                  <Field label="Município" value={resumo.municipality} onChange={v => setResumo(p => ({ ...p, municipality: v }))} />
                  <Field label="Gestor Processo" value={resumo.process_manager} onChange={v => setResumo(p => ({ ...p, process_manager: v }))} />
                  <Field label="Mês Reportado" value={resumo.reported_month} onChange={v => setResumo(p => ({ ...p, reported_month: v }))} />
                  <Field label="Agência Parceira" value={resumo.partner_agency} onChange={v => setResumo(p => ({ ...p, partner_agency: v }))} />
                </FieldGrid>
                <SaveButton loading={updateDeal.isPending} onClick={() => saveTab(resumo)} />
              </TabsContent>

              {/* CPCV & Escritura */}
              <TabsContent value="cpcv" className="space-y-4 mt-4">
                <FieldGrid>
                  <Field label="Data CPCV" value={cpcv.cpcv_date} onChange={v => setCpcv(p => ({ ...p, cpcv_date: v }))} />
                  <Field label="% CPCV" value={cpcv.cpcv_pct} onChange={v => setCpcv(p => ({ ...p, cpcv_pct: v }))} type="number" />
                  <Field label="Data Escritura" value={cpcv.deed_date} onChange={v => setCpcv(p => ({ ...p, deed_date: v }))} />
                  <Field label="% Escritura" value={cpcv.deed_pct} onChange={v => setCpcv(p => ({ ...p, deed_pct: v }))} type="number" />
                  <Field label="Dias Prazo" value={cpcv.deed_days} onChange={v => setCpcv(p => ({ ...p, deed_days: v }))} type="number" />
                  <Field label="Condicionado" value={cpcv.conditional} onChange={v => setCpcv(p => ({ ...p, conditional: v }))} />
                  <Field label="Valor Sinal (€)" value={cpcv.signal_value} onChange={v => setCpcv(p => ({ ...p, signal_value: v }))} type="number" />
                  <Field label="Sinal Devolvido (€)" value={cpcv.signal_returned} onChange={v => setCpcv(p => ({ ...p, signal_returned: v }))} type="number" />
                  <Field label="Documentação em falta" value={cpcv.docs_missing} onChange={v => setCpcv(p => ({ ...p, docs_missing: v }))} full />
                </FieldGrid>
                <SaveButton loading={updateDeal.isPending} onClick={() => saveTab(cpcv)} />
              </TabsContent>

              {/* FINANCEIRO */}
              <TabsContent value="financeiro" className="space-y-4 mt-4">
                <FieldGrid>
                  <Field label="Comissão Loja (€)" value={fin.commission_store} onChange={v => setFin(p => ({ ...p, commission_store: v }))} type="number" />
                  <Field label="Comissão Remax (€)" value={fin.commission_remax} onChange={v => setFin(p => ({ ...p, commission_remax: v }))} type="number" />
                  <Field label="Margem (€)" value={fin.margin} onChange={v => setFin(p => ({ ...p, margin: v }))} type="number" />
                  <Field label="Desconto Despesas (%)" value={fin.discount_pct} onChange={v => setFin(p => ({ ...p, discount_pct: v }))} type="number" />
                  <Field label="Valor Desconto (€)" value={fin.expense_discount} onChange={v => setFin(p => ({ ...p, expense_discount: v }))} type="number" />
                  <Field label="Margem Comercial (€)" value={fin.primary_margin} onChange={v => setFin(p => ({ ...p, primary_margin: v }))} type="number" />
                  <Field label="Nº Fatura" value={fin.invoice_number} onChange={v => setFin(p => ({ ...p, invoice_number: v }))} />
                  <Field label="Data Fatura" value={fin.invoice_date} onChange={v => setFin(p => ({ ...p, invoice_date: v }))} />
                  <Field label="Valor Fatura (€)" value={fin.invoice_value} onChange={v => setFin(p => ({ ...p, invoice_value: v }))} type="number" />
                  <Field label="Valor c/IVA (€)" value={fin.invoice_total_vat} onChange={v => setFin(p => ({ ...p, invoice_total_vat: v }))} type="number" />
                  <Field label="Destinatário Fatura" value={fin.invoice_recipient} onChange={v => setFin(p => ({ ...p, invoice_recipient: v }))} full />
                </FieldGrid>
                <SaveButton loading={updateDeal.isPending} onClick={() => saveTab(fin)} />
              </TabsContent>

              {/* PAGAMENTOS */}
              <TabsContent value="pagamentos" className="space-y-4 mt-4">
                <FieldGrid>
                  <Field label="Data Recebimento" value={pag.received_date} onChange={v => setPag(p => ({ ...p, received_date: v }))} />
                  <Field label="Mês Recebimento" value={pag.received_month} onChange={v => setPag(p => ({ ...p, received_month: v }))} />
                  <Field label="Data Pag. Consultor" value={pag.consultant_paid_date} onChange={v => setPag(p => ({ ...p, consultant_paid_date: v }))} />
                  <Field label="Data Pag. Parceira" value={pag.partner_paid_date} onChange={v => setPag(p => ({ ...p, partner_paid_date: v }))} />
                  <Field label="Nº Fatura Parceira" value={pag.partner_invoice_number} onChange={v => setPag(p => ({ ...p, partner_invoice_number: v }))} />
                </FieldGrid>
                <SaveButton loading={updateDeal.isPending} onClick={() => saveTab(pag)} />
              </TabsContent>

              {/* NOTAS */}
              <TabsContent value="notas" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea value={notas.notes} onChange={e => setNotas(p => ({ ...p, notes: e.target.value }))} rows={6} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ref. Arquivo</Label>
                  <Input value={notas.archive_ref} onChange={e => setNotas(p => ({ ...p, archive_ref: e.target.value }))} />
                </div>
                <SaveButton loading={updateDeal.isPending} onClick={() => saveTab(notas)} />
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <StatusChangeDialog deal={deal} open={statusDialogOpen} onOpenChange={setStatusDialogOpen} />
    </>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, value, onChange, type = 'text', full }: {
  label: string; value: any; onChange: (v: string) => void; type?: string; full?: boolean;
}) {
  return (
    <div className={cn('space-y-1.5', full && 'col-span-2')}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={loading} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? 'A guardar…' : 'Guardar'}
      </Button>
    </div>
  );
}
