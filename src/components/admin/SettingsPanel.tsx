import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Save, Bell, Mail, Shield, Clock, FileText, Plus, X, DollarSign, AlertTriangle, Copy, CheckSquare } from 'lucide-react';
import { LeadSettingsCard } from './LeadSettingsCard';
import { useAgencies } from '@/hooks/useAgencies';
import { supabase } from '@/integrations/supabase/client';
import {
  useContractDurationSettings, useUpdateContractDurationSettings,
  useCommissionTable, useCommissionSplit, useCommissionRental,
  useUpdateCommissionSettings,
  type CommissionTier, DEFAULT_COMMISSION_TIERS,
} from '@/hooks/useAgencySettings';

// ─── Agency Multi-Selector ───────────────────────────────────────
function AgencyMultiSelector({
  agencies,
  selectedIds,
  onSelectionChange,
}: {
  agencies: { id: string; name: string }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  const toggleAgency = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return; // keep at least one
      onSelectionChange(selectedIds.filter(a => a !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {agencies.map(agency => (
          <label key={agency.id} className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={selectedIds.includes(agency.id)}
              onCheckedChange={() => toggleAgency(agency.id)}
            />
            <span className="text-sm">{agency.name}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange(agencies.map(a => a.id))}
        >
          <CheckSquare className="h-3.5 w-3.5 mr-1" />
          Selecionar todas
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange(agencies.length > 0 ? [agencies[0].id] : [])}
        >
          Limpar seleção
        </Button>
      </div>
      {selectedIds.length > 1 && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          As alterações guardadas serão aplicadas a {selectedIds.length} agências selecionadas
        </div>
      )}
    </div>
  );
}

// ─── Confirm Multi-Apply AlertDialog ─────────────────────────────
function ConfirmMultiApplyDialog({
  open,
  agencyNames,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  agencyNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={open => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aplicar a múltiplas agências?</AlertDialogTitle>
          <AlertDialogDescription>
            Vais aplicar estas definições a: <strong>{agencyNames.join(', ')}</strong>. Confirmas?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar e aplicar a todas</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Copy Settings Dialog ────────────────────────────────────────
function CopySettingsDialog({
  open,
  onOpenChange,
  agencies,
  targetAgencyIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agencies: { id: string; name: string }[];
  targetAgencyIds: string[];
}) {
  const [sourceId, setSourceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ key: string; summary: string }[]>([]);

  const sourceAgencies = agencies.filter(a => !targetAgencyIds.includes(a.id));
  const targetNames = agencies.filter(a => targetAgencyIds.includes(a.id)).map(a => a.name);

  useEffect(() => {
    if (!sourceId) { setPreview([]); return; }
    supabase
      .from('agency_settings')
      .select('setting_key, setting_value')
      .eq('agency_id', sourceId)
      .then(({ data }) => {
        if (!data) { setPreview([]); return; }
        setPreview(data.map(row => {
          const val = row.setting_value as Record<string, unknown>;
          let summary = JSON.stringify(val).slice(0, 80);
          if (row.setting_key === 'commission_table') {
            const tiers = (val as any)?.tiers;
            summary = `${Array.isArray(tiers) ? tiers.length : '?'} escalões`;
          } else if (row.setting_key === 'commission_split') {
            summary = `Agente ${(val as any)?.agentSplit ?? '?'}% | Co-med ${(val as any)?.coMediacaoSplit ?? '?'}%`;
          } else if (row.setting_key === 'commission_rental') {
            summary = `${(val as any)?.months ?? '?'} rendas`;
          } else if (row.setting_key === 'contract_duration') {
            summary = `Padrão ${(val as any)?.defaultDays ?? '?'}d, ${((val as any)?.options as number[])?.length ?? '?'} opções`;
          }
          return { key: row.setting_key, summary };
        }));
      });
  }, [sourceId]);

  const handleCopy = async () => {
    if (!sourceId) return;
    setLoading(true);
    try {
      const { data: sourceSettings } = await supabase
        .from('agency_settings')
        .select('setting_key, setting_value')
        .eq('agency_id', sourceId);

      if (!sourceSettings?.length) {
        toast.error('Agência de origem sem definições');
        setLoading(false);
        return;
      }

      for (const targetId of targetAgencyIds) {
        for (const setting of sourceSettings) {
          await supabase
            .from('agency_settings')
            .upsert(
              { agency_id: targetId, setting_key: setting.setting_key, setting_value: setting.setting_value },
              { onConflict: 'agency_id,setting_key' }
            );
        }
      }

      const sourceName = agencies.find(a => a.id === sourceId)?.name ?? 'origem';
      toast.success(`Definições copiadas de ${sourceName} para: ${targetNames.join(', ')}`);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao copiar definições');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar definições de outra agência</DialogTitle>
          <DialogDescription>
            Seleciona a agência de origem para copiar todas as configurações para as agências destino.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Agência de origem</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar agência..." />
              </SelectTrigger>
              <SelectContent>
                {sourceAgencies.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preview.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Definições encontradas:</Label>
              {preview.map(p => (
                <div key={p.key} className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1">
                  <span className="font-medium">{p.key}</span>
                  <span className="text-muted-foreground">{p.summary}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Destino: <strong>{targetNames.join(', ')}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCopy} disabled={!sourceId || loading}>
            <Copy className="h-4 w-4 mr-1" />
            Copiar para agências selecionadas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main SettingsPanel ──────────────────────────────────────────
export function SettingsPanel() {
  const { data: agencies } = useAgencies();
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  // Confirm dialog state
  const [pendingSave, setPendingSave] = useState<{ fn: () => Promise<void> } | null>(null);

  // Set default selection when agencies load
  useEffect(() => {
    if (agencies?.length && selectedAgencyIds.length === 0) {
      setSelectedAgencyIds([agencies[0].id]);
    }
  }, [agencies]);

  const primaryAgencyId = selectedAgencyIds[0];
  const selectedAgencyNames = (agencies ?? [])
    .filter(a => selectedAgencyIds.includes(a.id))
    .map(a => a.name);

  const handleMultiSave = (saveFn: () => Promise<void>) => {
    if (selectedAgencyIds.length > 1) {
      setPendingSave({ fn: saveFn });
    } else {
      saveFn();
    }
  };

  // Estado das configurações (em produção, viria da API)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    leadAssignmentNotifications: true,
    objectiveReminders: true,
    weeklyReports: false,
    sessionTimeout: 60,
    requirePasswordChange: false,
    twoFactorAuth: false,
    defaultLeadSource: 'website',
    autoAssignLeads: true,
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    toast.success('Configurações guardadas com sucesso');
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Configurações gerais da plataforma
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Alterações
        </Button>
      </div>

      {/* Agency Multi-Selector */}
      {agencies && agencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aplicar a agências</CardTitle>
            <CardDescription>Selecione as agências onde as configurações serão aplicadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AgencyMultiSelector
              agencies={agencies}
              selectedIds={selectedAgencyIds}
              onSelectionChange={setSelectedAgencyIds}
            />
            <Button variant="outline" size="sm" onClick={() => setCopyDialogOpen(true)}>
              <Copy className="h-4 w-4 mr-1" />
              Copiar definições de outra agência
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Configurações de Leads */}
      {primaryAgencyId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações de Leads por Agência</CardTitle>
            <CardDescription>Configurações da agência principal selecionada</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadSettingsCard agencyId={primaryAgencyId} />
          </CardContent>
        </Card>
      )}

      {/* Contratos de Angariação */}
      {primaryAgencyId && (
        <ContractDurationCard
          agencyIds={selectedAgencyIds}
          primaryAgencyId={primaryAgencyId}
          onMultiSave={handleMultiSave}
        />
      )}

      {/* Comissionamento */}
      {primaryAgencyId && (
        <CommissionSettingsCard
          agencyIds={selectedAgencyIds}
          primaryAgencyId={primaryAgencyId}
          onMultiSave={handleMultiSave}
        />
      )}

      {/* Notificações */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Notificações</CardTitle>
          </div>
          <CardDescription>Configure as notificações do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">Receber notificações por email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) => updateSetting('emailNotifications', v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Atribuição de Leads</Label>
              <p className="text-sm text-muted-foreground">Notificar quando uma lead é atribuída</p>
            </div>
            <Switch
              checked={settings.leadAssignmentNotifications}
              onCheckedChange={(v) => updateSetting('leadAssignmentNotifications', v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Lembretes de Objetivos</Label>
              <p className="text-sm text-muted-foreground">Receber lembretes sobre objetivos pendentes</p>
            </div>
            <Switch
              checked={settings.objectiveReminders}
              onCheckedChange={(v) => updateSetting('objectiveReminders', v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Relatórios Semanais</Label>
              <p className="text-sm text-muted-foreground">Receber resumo semanal por email</p>
            </div>
            <Switch
              checked={settings.weeklyReports}
              onCheckedChange={(v) => updateSetting('weeklyReports', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Segurança</CardTitle>
          </div>
          <CardDescription>Configurações de segurança da conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Timeout de Sessão (minutos)</Label>
              <p className="text-sm text-muted-foreground">Tempo até expirar sessão inativa</p>
            </div>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 60)}
              className="w-24"
              min={5}
              max={480}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Forçar Alteração de Password</Label>
              <p className="text-sm text-muted-foreground">Novos utilizadores devem alterar password</p>
            </div>
            <Switch
              checked={settings.requirePasswordChange}
              onCheckedChange={(v) => updateSetting('requirePasswordChange', v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Autenticação de Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">Requerer 2FA para todos os utilizadores</p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(v) => updateSetting('twoFactorAuth', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operacional */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Operacional</CardTitle>
          </div>
          <CardDescription>Configurações operacionais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-atribuição de Leads</Label>
              <p className="text-sm text-muted-foreground">Distribuir leads automaticamente</p>
            </div>
            <Switch
              checked={settings.autoAssignLeads}
              onCheckedChange={(v) => updateSetting('autoAssignLeads', v)}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={settings.workingHoursStart}
                onChange={(e) => updateSetting('workingHoursStart', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário de Fim</Label>
              <Input
                type="time"
                value={settings.workingHoursEnd}
                onChange={(e) => updateSetting('workingHoursEnd', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Multi-Apply Dialog */}
      <ConfirmMultiApplyDialog
        open={!!pendingSave}
        agencyNames={selectedAgencyNames}
        onConfirm={() => {
          pendingSave?.fn();
          setPendingSave(null);
        }}
        onCancel={() => setPendingSave(null)}
      />

      {/* Copy Settings Dialog */}
      {agencies && (
        <CopySettingsDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          agencies={agencies}
          targetAgencyIds={selectedAgencyIds}
        />
      )}
    </div>
  );
}

// ─── Contract Duration Card ──────────────────────────────────────
function ContractDurationCard({
  agencyIds,
  primaryAgencyId,
  onMultiSave,
}: {
  agencyIds: string[];
  primaryAgencyId: string;
  onMultiSave: (fn: () => Promise<void>) => void;
}) {
  const { data: settings } = useContractDurationSettings(primaryAgencyId);
  const updateSettings = useUpdateContractDurationSettings();
  const [defaultDays, setDefaultDays] = useState(120);
  const [options, setOptions] = useState<number[]>([90, 120, 150, 180]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (settings) {
      setDefaultDays(settings.defaultDays);
      setOptions(settings.options);
    }
  }, [settings]);

  const addOption = () => {
    const val = parseInt(newOption);
    if (!val || val < 30 || options.includes(val)) return;
    setOptions(prev => [...prev, val].sort((a, b) => a - b));
    setNewOption('');
  };

  const removeOption = (val: number) => {
    setOptions(prev => prev.filter(o => o !== val));
  };

  const handleSave = () => {
    const finalDefault = options.includes(defaultDays) ? defaultDays : options[0] || 120;
    const saveFn = async () => {
      await Promise.all(
        agencyIds.map(agencyId =>
          updateSettings.mutateAsync({
            agencyId,
            settingKey: 'contract_duration',
            settingValue: { defaultDays: finalDefault, options },
          })
        )
      );
      toast.success(
        agencyIds.length > 1
          ? `Configurações de contrato aplicadas a ${agencyIds.length} agências`
          : 'Configurações de contrato guardadas'
      );
    };
    onMultiSave(saveFn);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Contratos de Angariação</CardTitle>
        </div>
        <CardDescription>Configurar durações disponíveis para os contratos de mediação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Duração padrão (dias)</Label>
          <Input
            type="number"
            min={30}
            value={defaultDays}
            onChange={e => setDefaultDays(parseInt(e.target.value) || 120)}
            className="w-32"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Opções disponíveis</Label>
          <div className="flex flex-wrap gap-2">
            {options.map(opt => (
              <Badge key={opt} variant="secondary" className="gap-1 text-sm">
                {opt}d
                <button type="button" onClick={() => removeOption(opt)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min={30}
              placeholder="Ex: 240"
              value={newOption}
              onChange={e => setNewOption(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addOption()}
              className="w-28"
            />
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Os agentes só poderão selecionar as durações aqui definidas ao criar ou editar leads de vendedores.
        </p>

        <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Commission Settings Card ────────────────────────────────────
function CommissionSettingsCard({
  agencyIds,
  primaryAgencyId,
  onMultiSave,
}: {
  agencyIds: string[];
  primaryAgencyId: string;
  onMultiSave: (fn: () => Promise<void>) => void;
}) {
  const { data: tableSettings } = useCommissionTable(primaryAgencyId);
  const { data: splitSettings } = useCommissionSplit(primaryAgencyId);
  const { data: rentalSettings } = useCommissionRental(primaryAgencyId);
  const updateSettings = useUpdateCommissionSettings();

  const [tiers, setTiers] = useState<CommissionTier[]>(DEFAULT_COMMISSION_TIERS);
  const [rentalMonths, setRentalMonths] = useState(1.5);
  const [agentSplit, setAgentSplit] = useState(50);
  const [coMediacaoSplit, setCoMediacaoSplit] = useState(50);

  useEffect(() => {
    if (tableSettings) setTiers(tableSettings.tiers);
  }, [tableSettings]);

  useEffect(() => {
    if (rentalSettings) setRentalMonths(rentalSettings.months);
  }, [rentalSettings]);

  useEffect(() => {
    if (splitSettings) {
      setAgentSplit(splitSettings.agentSplit);
      setCoMediacaoSplit(splitSettings.coMediacaoSplit);
    }
  }, [splitSettings]);

  const updateTier = (idx: number, field: keyof CommissionTier, value: string) => {
    setTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: field === 'from' ? Number(value) : field === 'to' ? (value === '' ? null : Number(value)) : value } : t));
  };

  const addTier = () => {
    const lastTo = tiers.length > 0 ? (tiers[tiers.length - 1].to ?? 999999) : 0;
    setTiers(prev => [...prev, { from: lastTo + 1, to: null, fee1: '5%', fee2: '4%' }]);
  };

  const removeTier = (idx: number) => {
    setTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const saveTable = () => {
    const saveFn = async () => {
      await Promise.all(
        agencyIds.map(agencyId =>
          updateSettings.mutateAsync({ agencyId, settingKey: 'commission_table', settingValue: { tiers } })
        )
      );
      toast.success(
        agencyIds.length > 1
          ? `Tabela de honorários aplicada a ${agencyIds.length} agências`
          : 'Tabela de honorários guardada'
      );
    };
    onMultiSave(saveFn);
  };

  const saveRental = () => {
    const saveFn = async () => {
      await Promise.all(
        agencyIds.map(agencyId =>
          updateSettings.mutateAsync({ agencyId, settingKey: 'commission_rental', settingValue: { months: rentalMonths } })
        )
      );
      toast.success(
        agencyIds.length > 1
          ? `Honorários de arrendamento aplicados a ${agencyIds.length} agências`
          : 'Honorários de arrendamento guardados'
      );
    };
    onMultiSave(saveFn);
  };

  const saveSplits = () => {
    const saveFn = async () => {
      await Promise.all(
        agencyIds.map(agencyId =>
          updateSettings.mutateAsync({ agencyId, settingKey: 'commission_split', settingValue: { agentSplit, coMediacaoSplit } })
        )
      );
      toast.success(
        agencyIds.length > 1
          ? `Divisões de comissão aplicadas a ${agencyIds.length} agências`
          : 'Divisões de comissão guardadas'
      );
    };
    onMultiSave(saveFn);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Comissionamento</CardTitle>
        </div>
        <CardDescription>Tabela de honorários, arrendamento e divisão de comissões</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2a. Tabela de Honorários (Venda) */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Tabela de Honorários (Venda)</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Valor (de)</TableHead>
                  <TableHead className="text-xs">Valor (até)</TableHead>
                  <TableHead className="text-xs">Honorário 1</TableHead>
                  <TableHead className="text-xs">Honorário 2</TableHead>
                  <TableHead className="text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" type="number" value={tier.from} onChange={e => updateTier(idx, 'from', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" placeholder="∞" value={tier.to ?? ''} onChange={e => updateTier(idx, 'to', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" value={tier.fee1} onChange={e => updateTier(idx, 'fee1', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" value={tier.fee2} onChange={e => updateTier(idx, 'fee2', e.target.value)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTier(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar escalão
            </Button>
            <Button size="sm" onClick={saveTable} disabled={updateSettings.isPending}>
              <Save className="h-4 w-4 mr-1" /> Guardar Tabela
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Valores em regime de exclusividade. IVA acresce sempre.
          </p>
        </div>

        <Separator />

        {/* 2b. Arrendamento */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Arrendamento</h4>
          <div className="space-y-1">
            <Label className="text-xs">Honorários de arrendamento (rendas)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min={0}
                value={rentalMonths}
                onChange={e => setRentalMonths(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">rendas</span>
            </div>
            <p className="text-xs text-muted-foreground">Número de rendas mensais cobradas como honorário.</p>
          </div>
          <Button size="sm" onClick={saveRental} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-1" /> Guardar
          </Button>
        </div>

        <Separator />

        {/* 2c. Divisão de Comissão */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Divisão de Comissão</h4>

          <div className="space-y-2">
            <Label className="text-xs">Divisão padrão angariador / vendedor</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={agentSplit}
                onChange={e => setAgentSplit(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                value={100 - agentSplit}
                disabled
                className="w-20 text-center bg-muted"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Divisão padrão em co-mediação</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={coMediacaoSplit}
                onChange={e => setCoMediacaoSplit(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                value={100 - coMediacaoSplit}
                disabled
                className="w-20 text-center bg-muted"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <Button size="sm" onClick={saveSplits} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-1" /> Guardar Divisões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
