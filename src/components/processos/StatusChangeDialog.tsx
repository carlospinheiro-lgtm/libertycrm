import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Deal, useChangeStatus } from '@/hooks/useDeals';

interface Props {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONFIGS: Record<number, { title: string; buttonLabel: string; buttonClass: string }> = {
  0: { title: 'Emitir Fatura', buttonLabel: 'Confirmar Fatura', buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/90' },
  1: { title: 'Marcar Recebido', buttonLabel: 'Confirmar Recebimento', buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  2: { title: 'Pagar Consultor', buttonLabel: 'Confirmar Pagamento', buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90' },
};

export function StatusChangeDialog({ deal, open, onOpenChange }: Props) {
  const changeStatus = useChangeStatus();
  const status = deal?.deal_status ?? 0;
  const config = CONFIGS[status];

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [invoiceValue, setInvoiceValue] = useState('');
  const [receivedDate, setReceivedDate] = useState<Date>();
  const [paidDate, setPaidDate] = useState<Date>();

  if (!deal || !config) return null;

  const handleConfirm = async () => {
    try {
      if (status === 0) {
        if (!invoiceNumber.trim() || !invoiceDate || !invoiceValue) {
          toast.error('Preencha todos os campos da fatura');
          return;
        }
        await changeStatus.mutateAsync({
          deal,
          newStatus: 1,
          extraFields: {
            invoice_number: invoiceNumber.trim(),
            invoice_date: format(invoiceDate, 'yyyy-MM-dd'),
            invoice_value: parseFloat(invoiceValue),
          },
          note: `Fatura ${invoiceNumber.trim()} emitida`,
        });
      } else if (status === 1) {
        if (!receivedDate) {
          toast.error('Selecione a data de recebimento');
          return;
        }
        await changeStatus.mutateAsync({
          deal,
          newStatus: 2,
          extraFields: { received_date: format(receivedDate, 'yyyy-MM-dd') },
          note: `Recebido a ${format(receivedDate, 'dd/MM/yyyy')}`,
        });
      } else if (status === 2) {
        if (!paidDate) {
          toast.error('Selecione a data de pagamento');
          return;
        }
        await changeStatus.mutateAsync({
          deal,
          newStatus: 3,
          extraFields: { consultant_paid_date: format(paidDate, 'yyyy-MM-dd') },
          note: `Consultor pago a ${format(paidDate, 'dd/MM/yyyy')}`,
        });
      }
      toast.success('Estado atualizado com sucesso');
      onOpenChange(false);
      setInvoiceNumber(''); setInvoiceDate(undefined); setInvoiceValue('');
      setReceivedDate(undefined); setPaidDate(undefined);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar estado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>PV: {deal.pv_number || '—'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {status === 0 && (
            <>
              <div className="space-y-1.5">
                <Label>Nº Fatura</Label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="FAT-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Data Fatura</Label>
                <DatePick value={invoiceDate} onChange={setInvoiceDate} />
              </div>
              <div className="space-y-1.5">
                <Label>Valor Fatura (€)</Label>
                <Input type="number" value={invoiceValue} onChange={e => setInvoiceValue(e.target.value)} />
              </div>
            </>
          )}
          {status === 1 && (
            <div className="space-y-1.5">
              <Label>Data de Recebimento</Label>
              <DatePick value={receivedDate} onChange={setReceivedDate} />
            </div>
          )}
          {status === 2 && (
            <div className="space-y-1.5">
              <Label>Data Pagamento Consultor</Label>
              <DatePick value={paidDate} onChange={setPaidDate} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={changeStatus.isPending} className={config.buttonClass}>
            {changeStatus.isPending ? 'A processar…' : config.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DatePick({ value, onChange }: { value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd/MM/yyyy') : 'Selecionar data'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}
