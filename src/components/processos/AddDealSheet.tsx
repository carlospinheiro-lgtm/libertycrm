import { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCreateDeal, useUpdateDeal, Deal } from '@/hooks/useDeals';
import { useConsultants, Consultant } from '@/hooks/useConsultants';
import { calculateCommission, CommissionResult } from '@/lib/commissionCalc';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
}

export function AddDealSheet({ open, onOpenChange, deal }: Props) {
  const { currentUser } = useAuth();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const isEdit = !!deal;
  const { data: activeConsultants = [] } = useConsultants();

  const [pvNumber, setPvNumber] = useState('');
  const [dealType, setDealType] = useState('');
  const [consultantName, setConsultantName] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
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
  const [sideFraction, setSideFraction] = useState('1');
  const [hasReferral, setHasReferral] = useState(false);
  const [referralPct, setReferralPct] = useState('25');
  const [referralName, setReferralName] = useState('');

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
      setSideFraction(deal.side_fraction != null ? String(deal.side_fraction) : '1');
      if (deal.referral_pct && deal.referral_pct > 0) {
        setHasReferral(true);
        setReferralPct(String(deal.referral_pct));
        setReferralName(deal.referral_name || '');
      } else {
        setHasReferral(false);
        setReferralPct('25');
        setReferralName('');
      }
      const found = activeConsultants.find(c => c.name === deal.consultant_name);
      setSelectedConsultant(found || null);
    } else {
      reset();
    }
  }, [deal, activeConsultants]);

  const commissionPreview = useMemo<CommissionResult | null>(() => {
    const sv = parseFloat(saleValue);
    const cp = parseFloat(commissionPct);
    const sf = parseFloat(sideFraction);
    if (!sv || !cp || !sf || !selectedConsultant) return null;
    return calculateCommission({
      saleValue: sv,
      commissionPct: cp,
      sideFraction: sf,
      referralPct: hasReferral ? (parseFloat(referralPct) || 0) : 0,
      consultant: selectedConsultant,
    });
  }, [saleValue, commissionPct, sideFraction, hasReferral, referralPct, selectedConsultant]);

  const needsConfirmation = useMemo(() => {
    if (!selectedConsultant) return false;
    const sys = selectedConsultant.is_team_member ? 'TRAINEE' : (selectedConsultant.commission_system || 'RAPP').toUpperCase();
    return (sys === 'RAPP' || sys === 'TRAINEE') && !selectedConsultant.accumulated_12m_confirmed;
  }, [selectedConsultant]);

  const reset = () => {
    setPvNumber(''); setDealType(''); setConsultantName(''); setSelectedConsultant(null);
    setSaleValue(''); setCommissionPct(''); setAddress(''); setMunicipality('');
    setPartnerAgency(''); setProcessManager(''); setReportedMonth(format(new Date(), 'yy-MM'));
    setBuyerName(''); setBuyerNif(''); setCpcvDate(undefined); setDeedDate(undefined);
    setNotes(''); setSideFraction('1'); setHasReferral(false); setReferralPct('25'); setReferralName('');
  };

  const handleSave = async () => {
    const missing: string[] = [];
    if (!pvNumber.trim()) missing.push('Nº PV');
    if (!dealType) missing.push('Tipo');
    if (!consultantName.trim()) missing.push('Consultor');
    if (!saleValue) missing.push('Valor Venda');
    if (!commissionPct) missing.push('% Comissão');
    if (!address.trim()) missing.push('Morada');
    if (missing.length > 0) {
      toast.error(`Campos obrigatórios em falta: ${missing.join(', ')}`);
      return;
    }

    const sf = parseFloat(sideFraction);
    const rp = hasReferral ? (parseFloat(referralPct) || 0) : 0;

    const payload: Record<string, any> = {
      pv_number: pvNumber.trim(),
      deal_type: dealType,
      consultant_name: consultantName.trim(),
      sale_value: parseFloat(saleValue),
      commission_pct: parseFloat(commissionPct),
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
      side_fraction: sf,
      referral_pct: rp,
      referral_name: hasReferral ? (referralName.trim() || null) : null,
    };

    if (commissionPreview) {
      payload.commission_store = commissionPreview.agencySide;
      payload.consultant_commission = commissionPreview.agentAmount;
      payload.agency_net = commissionPreview.agencyNet;
      payload.referral_amount = commissionPreview.referralAmount;
    }

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
      toast.error(err.message === 'Sem agência' ? 'Erro: sem agência associada.' : (err.message || 'Erro ao guardar'));
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
            <Select
              value={consultantName}
              onValueChange={(val) => {
                setConsultantName(val);
                const found = activeConsultants.find(c => c.name === val);
                setSelectedConsultant(found || null);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar consultor" /></SelectTrigger>
              <SelectContent>
                {activeConsultants.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor Venda (€) *</Label>
              <Input type="number" value={saleValue} onChange={e => setSaleValue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>% Comissão Mediação *</Label>
              <Input type="number" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} placeholder="5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Morada *</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, nº, localidade" />
          </div>

          <hr className="my-2" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lado & Referência</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Lado</Label>
              <Select value={sideFraction} onValueChange={setSideFraction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">100% Exclusivo</SelectItem>
                  <SelectItem value="0.5">50% Partilhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Referência</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={hasReferral} onCheckedChange={setHasReferral} />
                <span className="text-sm text-muted-foreground">{hasReferral ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>

          {hasReferral && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>% Referência</Label>
                <Input type="number" value={referralPct} onChange={e => setReferralPct(e.target.value)} placeholder="25" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome referente</Label>
                <Input value={referralName} onChange={e => setReferralName(e.target.value)} />
              </div>
            </div>
          )}

          {/* Commission Preview */}
          {commissionPreview && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <h4 className="font-semibold text-foreground">Cálculo em cascata</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Comissão total:</span>
                <span className="text-right font-medium">{formatCurrency(commissionPreview.totalCommission)}</span>
                <span className="text-muted-foreground">Lado agência ({(parseFloat(sideFraction) * 100).toFixed(0)}%):</span>
                <span className="text-right font-medium">{formatCurrency(commissionPreview.agencySide)}</span>
                {commissionPreview.referralAmount > 0 && (
                  <>
                    <span className="text-muted-foreground">Referência ({referralPct}%):</span>
                    <span className="text-right font-medium text-destructive">-{formatCurrency(commissionPreview.referralAmount)}</span>
                  </>
                )}
                <span className="text-muted-foreground">Base agente:</span>
                <span className="text-right font-medium">{formatCurrency(commissionPreview.agencyAfterReferral)}</span>
                <span className="text-muted-foreground">Sistema:</span>
                <span className="text-right font-semibold text-primary">{commissionPreview.systemLabel}</span>
                <span className="text-muted-foreground">Comissão agente:</span>
                <span className="text-right font-bold text-primary">{formatCurrency(commissionPreview.agentAmount)}</span>
                <span className="text-muted-foreground">Fica na agência:</span>
                <span className="text-right font-medium">{formatCurrency(commissionPreview.agencyNet)}</span>
              </div>
            </div>
          )}

          {needsConfirmation && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>O acumulado 12 meses deste consultor não está confirmado. Confirme o valor antes de gravar.</span>
            </div>
          )}

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
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <Button onClick={handleSave} disabled={isPending || needsConfirmation} className="w-full gap-2">
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
