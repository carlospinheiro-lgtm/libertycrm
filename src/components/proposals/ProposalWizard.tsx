import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, FileText, Save, Send, X } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ProposalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    clientName: string;
    email?: string;
    phone?: string;
    nif?: string;
  };
  agencyId: string;
  onComplete: (status: string) => void;
  onCancel: () => void;
}

const DEFAULT_CONDITIONS = [
  { id: 'credit', label: 'Sujeito a aprovação de crédito', checked: false },
  { id: 'inspection', label: 'Sujeito a vistoria do imóvel', checked: false },
  { id: 'mortgage', label: 'Sujeito a distrate de hipoteca', checked: false },
  { id: 'vacant', label: 'Entrega do imóvel devoluto', checked: false },
  { id: 'furniture', label: 'Inclusão de recheio / mobiliário', checked: false },
];

const STEPS = [
  'Dados da Proposta',
  'Dados do Cliente',
  'Dados do Imóvel',
  'Condições Especiais',
  'Revisão & Ação',
];

export function ProposalWizard({ open, onOpenChange, lead, agencyId, onComplete, onCancel }: ProposalWizardProps) {
  const { user } = useAuth();
  const { addProposal, generateProposalNumber } = useProposals();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultValidity = format(addDays(new Date(), 15), 'yyyy-MM-dd');

  // Form state
  const [form, setForm] = useState({
    proposalNumber: generateProposalNumber(),
    proposalDate: today,
    validityDate: defaultValidity,
    dealType: 'venda',
    proposedValue: '',
    paymentMethod: 'comptado',
    mortgageAmount: '',
    bank: '',
    approvalStatus: '',
    downPayment: '',
    downPaymentDate: '',
    deedDate: '',
    // Client
    clientName: lead.clientName || '',
    clientNif: lead.nif || '',
    clientAddress: '',
    clientEmail: lead.email || '',
    clientPhone: lead.phone || '',
    coTitularName: '',
    coTitularNif: '',
    // Property
    propertyAddress: '',
    propertyTypology: '',
    propertyArea: '',
    propertyReference: '',
    conditionNotes: '',
    inspectionRequired: false,
    inspectionDeadline: '',
    // Conditions
    specialConditions: '',
    conditionsChecklist: DEFAULT_CONDITIONS.map(c => ({ ...c })),
    otherCondition: '',
  });

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (id: string) => {
    setForm(prev => ({
      ...prev,
      conditionsChecklist: prev.conditionsChecklist.map(c =>
        c.id === id ? { ...c, checked: !c.checked } : c
      ),
    }));
  };

  const handleSave = async (status: string) => {
    setSaving(true);
    try {
      await addProposal.mutateAsync({
        lead_id: lead.id,
        agency_id: agencyId,
        proposal_number: form.proposalNumber,
        proposal_date: form.proposalDate,
        validity_date: form.validityDate || null,
        deal_type: form.dealType,
        proposed_value: parseFloat(form.proposedValue) || 0,
        payment_method: form.paymentMethod,
        mortgage_amount: form.mortgageAmount ? parseFloat(form.mortgageAmount) : null,
        bank: form.bank || null,
        approval_status: form.approvalStatus || null,
        down_payment: form.downPayment ? parseFloat(form.downPayment) : null,
        down_payment_date: form.downPaymentDate || null,
        deed_date: form.deedDate || null,
        client_name: form.clientName || null,
        client_nif: form.clientNif || null,
        client_address: form.clientAddress || null,
        client_email: form.clientEmail || null,
        client_phone: form.clientPhone || null,
        co_titular_name: form.coTitularName || null,
        co_titular_nif: form.coTitularNif || null,
        property_address: form.propertyAddress || null,
        property_typology: form.propertyTypology || null,
        property_area: form.propertyArea ? parseFloat(form.propertyArea) : null,
        property_reference: form.propertyReference || null,
        condition_notes: form.conditionNotes || null,
        inspection_required: form.inspectionRequired,
        inspection_deadline: form.inspectionDeadline || null,
        special_conditions: form.specialConditions || null,
        conditions_checklist: form.conditionsChecklist.filter(c => c.checked).map(c => c.label),
        status,
        rejection_reason: null,
        pdf_url: null,
        created_by: user?.id || null,
      });
      onComplete(status);
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const canNext = () => {
    if (currentStep === 0) return !!form.proposedValue && parseFloat(form.proposedValue) > 0;
    return true;
  };

  const formatCurrency = (v: string) => {
    const num = parseFloat(v);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(num);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Nova Proposta — {lead.clientName}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors',
                  i === currentStep ? 'bg-primary text-primary-foreground' :
                  i < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {i + 1}
              </div>
              <span className={cn('text-xs hidden sm:block truncate', i === currentStep ? 'font-semibold' : 'text-muted-foreground')}>
                {step}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-4 min-h-[300px]">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nº Proposta</Label>
                  <Input value={form.proposalNumber} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.proposalDate} onChange={e => updateForm('proposalDate', e.target.value)} />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" value={form.validityDate} onChange={e => updateForm('validityDate', e.target.value)} />
                </div>
                <div>
                  <Label>Tipo de Negócio</Label>
                  <Select value={form.dealType} onValueChange={v => updateForm('dealType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="arrendamento">Arrendamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Valor Proposto (€) *</Label>
                <Input type="number" placeholder="250000" value={form.proposedValue} onChange={e => updateForm('proposedValue', e.target.value)} />
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={form.paymentMethod} onValueChange={v => updateForm('paymentMethod', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comptado">A Pronto</SelectItem>
                    <SelectItem value="financiamento">Financiamento Bancário</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.paymentMethod === 'financiamento' || form.paymentMethod === 'misto') && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-md">
                  <div>
                    <Label>Montante Financiamento (€)</Label>
                    <Input type="number" value={form.mortgageAmount} onChange={e => updateForm('mortgageAmount', e.target.value)} />
                  </div>
                  <div>
                    <Label>Banco</Label>
                    <Input value={form.bank} onChange={e => updateForm('bank', e.target.value)} />
                  </div>
                  <div>
                    <Label>Estado Aprovação</Label>
                    <Select value={form.approvalStatus} onValueChange={v => updateForm('approvalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="pre_approved">Pré-Aprovado</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Recusado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sinal (€)</Label>
                  <Input type="number" value={form.downPayment} onChange={e => updateForm('downPayment', e.target.value)} />
                </div>
                <div>
                  <Label>Data Escritura Proposta</Label>
                  <Input type="date" value={form.deedDate} onChange={e => updateForm('deedDate', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <p className="text-sm text-muted-foreground">Dados pré-preenchidos da lead. Pode editar se necessário.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.clientName} onChange={e => updateForm('clientName', e.target.value)} />
                </div>
                <div>
                  <Label>NIF</Label>
                  <Input value={form.clientNif} onChange={e => updateForm('clientNif', e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.clientEmail} onChange={e => updateForm('clientEmail', e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.clientPhone} onChange={e => updateForm('clientPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Morada</Label>
                <Input value={form.clientAddress} onChange={e => updateForm('clientAddress', e.target.value)} />
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-semibold text-sm mb-3">Co-Titular (opcional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.coTitularName} onChange={e => updateForm('coTitularName', e.target.value)} />
                  </div>
                  <div>
                    <Label>NIF</Label>
                    <Input value={form.coTitularNif} onChange={e => updateForm('coTitularNif', e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Morada do Imóvel</Label>
                  <Input value={form.propertyAddress} onChange={e => updateForm('propertyAddress', e.target.value)} />
                </div>
                <div>
                  <Label>Tipologia</Label>
                  <Select value={form.propertyTypology} onValueChange={v => updateForm('propertyTypology', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {['T0', 'T1', 'T2', 'T3', 'T4', 'T5+', 'Moradia', 'Loja', 'Escritório', 'Terreno', 'Outro'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Área (m²)</Label>
                  <Input type="number" value={form.propertyArea} onChange={e => updateForm('propertyArea', e.target.value)} />
                </div>
                <div>
                  <Label>Referência</Label>
                  <Input value={form.propertyReference} onChange={e => updateForm('propertyReference', e.target.value)} placeholder="REF-XXXX" />
                </div>
              </div>
              <div>
                <Label>Notas de Condição</Label>
                <Textarea value={form.conditionNotes} onChange={e => updateForm('conditionNotes', e.target.value)} placeholder="Mobiliário incluído, exclusões, condições especiais..." />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={form.inspectionRequired} onCheckedChange={v => updateForm('inspectionRequired', v)} id="inspection" />
                <Label htmlFor="inspection">Vistoria obrigatória</Label>
                {form.inspectionRequired && (
                  <Input type="date" className="w-44 ml-auto" value={form.inspectionDeadline} onChange={e => updateForm('inspectionDeadline', e.target.value)} />
                )}
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <Label>Condições Especiais (texto livre)</Label>
                <Textarea rows={4} value={form.specialConditions} onChange={e => updateForm('specialConditions', e.target.value)} placeholder="Cláusulas adicionais..." />
              </div>
              <div className="space-y-2">
                <Label>Checklist de Condições</Label>
                {form.conditionsChecklist.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox checked={c.checked} onCheckedChange={() => toggleCondition(c.id)} id={c.id} />
                    <Label htmlFor={c.id} className="font-normal">{c.label}</Label>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                <h4 className="font-bold text-base">Resumo da Proposta</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <span className="text-muted-foreground">Nº Proposta:</span>
                  <span className="font-medium">{form.proposalNumber}</span>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{form.dealType === 'venda' ? 'Venda' : 'Arrendamento'}</span>
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-primary">{formatCurrency(form.proposedValue)}</span>
                  <span className="text-muted-foreground">Pagamento:</span>
                  <span className="font-medium">{form.paymentMethod === 'comptado' ? 'A Pronto' : form.paymentMethod === 'financiamento' ? 'Financiamento' : 'Misto'}</span>
                  {form.downPayment && <>
                    <span className="text-muted-foreground">Sinal:</span>
                    <span className="font-medium">{formatCurrency(form.downPayment)}</span>
                  </>}
                  {form.deedDate && <>
                    <span className="text-muted-foreground">Escritura:</span>
                    <span className="font-medium">{new Date(form.deedDate).toLocaleDateString('pt-PT')}</span>
                  </>}
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium ml-2">{form.clientName}</span>
                  {form.clientNif && <span className="text-muted-foreground ml-2">NIF: {form.clientNif}</span>}
                </div>
                {form.propertyAddress && (
                  <div className="border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Imóvel:</span>
                    <span className="font-medium ml-2">{form.propertyAddress}</span>
                    {form.propertyTypology && <Badge variant="outline" className="ml-2">{form.propertyTypology}</Badge>}
                  </div>
                )}
                {form.conditionsChecklist.some(c => c.checked) && (
                  <div className="border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground block mb-1">Condições:</span>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                      {form.conditionsChecklist.filter(c => c.checked).map(c => (
                        <li key={c.id}>{c.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={saving}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canNext()}>
                Seguinte
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  Rascunho
                </Button>
                <Button onClick={() => handleSave('sent')} disabled={saving}>
                  <Send className="h-4 w-4 mr-1" />
                  Guardar & Enviar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
