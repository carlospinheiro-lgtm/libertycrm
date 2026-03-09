import { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCreateDeal, useUpdateDeal, Deal } from '@/hooks/useDeals';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
}

export function AddDealSheet({ open, onOpenChange, deal }: Props) {
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const isEdit = !!deal;

  const [pvNumber, setPvNumber] = useState('');
  const [dealType, setDealType] = useState('');
  const [consultantName, setConsultantName] = useState('');
  const [saleValue, setSaleValue] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [address, setAddress] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [partnerAgency, setPartnerAgency] = useState('');
  const [processManager, setProcessManager] = useState('');
  const [reportedMonth, setReportedMonth] = useState(format(new Date(), 'yy-MM'));
  const [buyerName, setBuyerName] = useState('');
  const [buyerNif, setBuyerNif] = useState('');
  const [cpcvDate, setCpcvDate] = useState<Date>();
  const [deedDate, setDeedDate] = useState<Date>();
  const [notes, setNotes] = useState('');

  // Populate fields when editing
  useEffect(() => {
    if (deal) {
      setPvNumber(deal.pv_number || '');
      setDealType(deal.deal_type || '');
      setConsultantName(deal.consultant_name || '');
      setSaleValue(deal.sale_value != null ? String(deal.sale_value) : '');
      setCommissionPct(deal.commission_pct != null ? String(deal.commission_pct) : '');
      setAddress(deal.address || '');
      setMunicipality(deal.municipality || '');
      setPartnerAgency(deal.partner_agency || '');
      setProcessManager(deal.process_manager || '');
      setReportedMonth(deal.reported_month || format(new Date(), 'yy-MM'));
      setBuyerName(deal.buyer_name || '');
      setBuyerNif(deal.buyer_nif || '');
      setCpcvDate(deal.cpcv_date ? new Date(deal.cpcv_date) : undefined);
      setDeedDate(deal.deed_date ? new Date(deal.deed_date) : undefined);
      setNotes(deal.notes || '');
    } else {
      reset();
    }
  }, [deal]);

  const commissionStore = useMemo(() => {
    if (saleValue && commissionPct) {
      const calc = parseFloat(saleValue) * (parseFloat(commissionPct) / 100);
      return isNaN(calc) ? '' : calc.toFixed(2);
    }
    return '';
  }, [saleValue, commissionPct]);

  const reset = () => {
    setPvNumber(''); setDealType(''); setConsultantName(''); setSaleValue('');
    setCommissionPct(''); setAddress(''); setMunicipality(''); setPartnerAgency('');
    setProcessManager(''); setReportedMonth(format(new Date(), 'yy-MM')); setBuyerName(''); setBuyerNif('');
    setCpcvDate(undefined); setDeedDate(undefined); setNotes('');
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!pvNumber.trim()) missing.push('Nº PV');
    if (!dealType) missing.push('Tipo');
    if (!consultantName.trim()) missing.push('Consultor');
    if (saleValue === '' || saleValue === undefined) missing.push('Valor Venda');
    if (commissionPct === '' || commissionPct === undefined) missing.push('% Comissão');
    if (!address.trim()) missing.push('Morada');

    if (missing.length > 0) {
      toast.error(`Campos obrigatórios em falta: ${missing.join(', ')}`);
      return;
    }

    const payload = {
      pv_number: pvNumber.trim(),
      deal_type: dealType,
      consultant_name: consultantName.trim(),
      sale_value: parseFloat(saleValue),
      commission_pct: parseFloat(commissionPct),
      commission_store: commissionStore ? parseFloat(commissionStore) : null,
      address: address.trim(),
      municipality: municipality.trim() || null,
      partner_agency: partnerAgency.trim() || null,
      process_manager: processManager.trim() || null,
      reported_month: reportedMonth.trim() || null,
      buyer_name: buyerName.trim() || null,
      buyer_nif: buyerNif.trim() || null,
      cpcv_date: cpcvDate ? format(cpcvDate, 'yyyy-MM-dd') : null,
      deed_date: deedDate ? format(deedDate, 'yyyy-MM-dd') : null,
      notes: notes.trim() || null,
    };

    try {
      if (isEdit) {
        await updateDeal.mutateAsync({ id: deal!.id, ...payload });
        toast.success('✅ Processo atualizado com sucesso');
      } else {
        await createDeal.mutateAsync(payload);
        toast.success('✅ Processo criado com sucesso');
      }
      reset();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao guardar processo:', err);
      if (err.message === 'Sem agência') {
        toast.error('Erro: sem agência associada ao utilizador. Contacte o administrador.');
      } else {
        toast.error(err.message || 'Erro ao guardar processo');
      }
    }
  };

  const isPending = createDeal.isPending || updateDeal.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Processo' : 'Novo Processo'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campos obrigatórios</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nº PV *</Label>
              <Input value={pvNumber} onChange={e => setPvNumber(e.target.value)} placeholder="PV-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={dealType} onValueChange={setDealType}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda">Venda</SelectItem>
                  <SelectItem value="AngariaçãoVenda">Ang. Venda</SelectItem>
                  <SelectItem value="AngariaArrenda">Ang. Arrenda</SelectItem>
                  <SelectItem value="Arrenda">Arrenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Consultor *</Label>
            <Input value={consultantName} onChange={e => setConsultantName(e.target.value)} placeholder="Nome do consultor" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Valor Venda (€) *</Label>
              <Input type="number" value={saleValue} onChange={e => setSaleValue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>% Comissão *</Label>
              <Input type="number" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label>Comissão Loja (calculada)</Label>
              <Input type="number" value={commissionStore} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Morada *</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, nº, localidade" />
          </div>

          <hr className="my-2" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Campos opcionais</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Município</Label>
              <Input value={municipality} onChange={e => setMunicipality(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Agência Parceira</Label>
              <Input value={partnerAgency} onChange={e => setPartnerAgency(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gestor Processo</Label>
              <Input value={processManager} onChange={e => setProcessManager(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mês Reportado</Label>
              <Input value={reportedMonth} onChange={e => setReportedMonth(e.target.value)} placeholder="26-03" />
            </div>
            <div className="space-y-1.5">
              <Label>Nome Comprador</Label>
              <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>NIF Comprador</Label>
              <Input value={buyerNif} onChange={e => setBuyerNif(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField label="Data CPCV" value={cpcvDate} onChange={setCpcvDate} />
            <DateField label="Data Escritura" value={deedDate} onChange={setDeedDate} />
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {isPending ? 'A guardar…' : isEdit ? 'Guardar Alterações' : 'Criar Processo'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DateField({ label, value, onChange }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'dd/MM/yyyy') : 'Selecionar'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}
