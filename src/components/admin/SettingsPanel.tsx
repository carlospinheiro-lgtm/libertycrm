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
