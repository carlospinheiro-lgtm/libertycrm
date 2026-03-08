import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { Save, Bell, Mail, Shield, Clock, FileText, Plus, X, DollarSign } from 'lucide-react';
import { LeadSettingsCard } from './LeadSettingsCard';
import { useAgencies } from '@/hooks/useAgencies';
import {
  useContractDurationSettings, useUpdateContractDurationSettings,
  useCommissionTable, useCommissionSplit, useCommissionRental,
  useUpdateCommissionSettings,
  type CommissionTier, DEFAULT_COMMISSION_TIERS,
} from '@/hooks/useAgencySettings';

export function SettingsPanel() {
  const { data: agencies } = useAgencies();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | undefined>();
  
  // Estado das configurações (em produção, viria da API)
  const [settings, setSettings] = useState({
    // Notificações
    emailNotifications: true,
    leadAssignmentNotifications: true,
    objectiveReminders: true,
    weeklyReports: false,
    
    // Segurança
    sessionTimeout: 60,
    requirePasswordChange: false,
    twoFactorAuth: false,
    
    // Operacional
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

      {/* Configurações de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações de Leads por Agência</CardTitle>
          <CardDescription>Selecione uma agência para configurar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma agência" />
            </SelectTrigger>
            <SelectContent>
              {agencies?.map(agency => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedAgencyId && (
            <LeadSettingsCard agencyId={selectedAgencyId} />
          )}
        </CardContent>
      </Card>

      {/* Contratos de Angariação */}
      {selectedAgencyId && (
        <ContractDurationCard agencyId={selectedAgencyId} />
      )}

      {/* Comissionamento */}
      {selectedAgencyId && (
        <CommissionSettingsCard agencyId={selectedAgencyId} />
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
    </div>
  );
}

function ContractDurationCard({ agencyId }: { agencyId: string }) {
  const { data: settings } = useContractDurationSettings(agencyId);
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
    updateSettings.mutate(
      { agencyId, settingKey: 'contract_duration', settingValue: { defaultDays: finalDefault, options } },
      { onSuccess: () => toast.success('Configurações de contrato guardadas') }
    );
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

function CommissionSettingsCard({ agencyId }: { agencyId: string }) {
  const { data: tableSettings } = useCommissionTable(agencyId);
  const { data: splitSettings } = useCommissionSplit(agencyId);
  const { data: rentalSettings } = useCommissionRental(agencyId);
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
    updateSettings.mutate(
      { agencyId, settingKey: 'commission_table', settingValue: { tiers } },
      { onSuccess: () => toast.success('Tabela de honorários guardada') }
    );
  };

  const saveRental = () => {
    updateSettings.mutate(
      { agencyId, settingKey: 'commission_rental', settingValue: { months: rentalMonths } },
      { onSuccess: () => toast.success('Honorários de arrendamento guardados') }
    );
  };

  const saveSplits = () => {
    updateSettings.mutate(
      { agencyId, settingKey: 'commission_split', settingValue: { agentSplit, coMediacaoSplit } },
      { onSuccess: () => toast.success('Divisões de comissão guardadas') }
    );
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
