import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserCheck, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Consultant = Database['public']['Tables']['consultants']['Row'];

/** Map legacy commission_system values to current ones */
function normalizeSystem(sys: string | null): string {
  if (!sys) return '';
  if (sys === 'Alternativo') return 'RAPP';
  if (sys === 'Fixo') return 'PURO';
  return sys;
}

function getTierPct(system: string, accumulated: number, hasCompany: boolean): string {
  if (system === 'RAPP') {
    if (accumulated < 25000) return '40%';
    if (accumulated < 50000) return '48%';
    return '50%';
  }
  if (system === 'Trainee') {
    if (accumulated < 25000) return '30%';
    if (accumulated < 50000) return '35%';
    return '40%';
  }
  if (system === 'PURO') {
    return hasCompany ? '72.8%' : '70%';
  }
  return '';
}

export default function Consultores() {
  const { currentUser } = useAuth();
  const agencyId = currentUser?.agencyId;
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Consultant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consultant | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [tier, setTier] = useState('');
  const [commissionSystem, setCommissionSystem] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [hasCompany, setHasCompany] = useState(false);
  const [team, setTeam] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [accumulated12m, setAccumulated12m] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [accumulated12mConfirmed, setAccumulated12mConfirmed] = useState(false);

  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['consultants', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('agency_id', agencyId)
        .order('name');
      if (error) throw error;
      return data as Consultant[];
    },
    enabled: !!agencyId,
  });

  // Count of active RAPP/Trainee consultants with unconfirmed accumulated
  const unconfirmedCount = useMemo(() => {
    return consultants.filter(c => {
      if (!c.is_active) return false;
      const sys = c.is_team_member ? 'Trainee' : normalizeSystem(c.commission_system);
      return (sys === 'RAPP' || sys === 'Trainee') && !c.accumulated_12m_confirmed;
    }).length;
  }, [consultants]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('consultants').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('consultants').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      toast.success(editing ? '✅ Consultor atualizado' : '✅ Consultor criado');
      closeSheet();
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      toast.success('Consultor eliminado');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao eliminar'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('consultants').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultants'] }),
  });

  const resetForm = () => {
    setName(''); setNif(''); setEntryDate(''); setTier(''); setCommissionSystem('');
    setCommissionPct(''); setHasCompany(false); setTeam(''); setTeamLeader('');
    setAccumulated12m('0'); setIsActive(true); setIsTeamMember(false); setAccumulated12mConfirmed(false);
  };

  const openCreate = () => { resetForm(); setEditing(null); setSheetOpen(true); };

  const openEdit = (c: Consultant) => {
    setEditing(c);
    setName(c.name); setNif(c.nif || ''); setEntryDate(c.entry_date || '');
    setTier(c.tier || ''); setCommissionSystem(normalizeSystem(c.commission_system) || '');
    setCommissionPct(c.commission_pct != null ? String(c.commission_pct) : '');
    setHasCompany(c.has_company ?? false); setTeam(c.team || ''); setTeamLeader(c.team_leader || '');
    setAccumulated12m(c.accumulated_12m != null ? String(c.accumulated_12m) : '0');
    setIsActive(c.is_active ?? true);
    setIsTeamMember(c.is_team_member ?? false);
    setAccumulated12mConfirmed(c.accumulated_12m_confirmed ?? false);
    // If team member, force Trainee display
    if (c.is_team_member) setCommissionSystem('Trainee');
    setSheetOpen(true);
  };

  const closeSheet = () => { setSheetOpen(false); setEditing(null); resetForm(); };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload: any = {
      name: name.trim(),
      nif: nif.trim() || null,
      entry_date: entryDate || null,
      tier: tier || null,
      commission_system: commissionSystem || null,
      commission_pct: commissionPct ? parseFloat(commissionPct) : null,
      has_company: hasCompany,
      team: team.trim() || null,
      team_leader: teamLeader.trim() || null,
      accumulated_12m: accumulated12m ? parseFloat(accumulated12m) : 0,
      is_active: isActive,
      is_team_member: isTeamMember,
      accumulated_12m_confirmed: accumulated12mConfirmed,
    };
    if (editing) {
      payload.id = editing.id;
    } else {
      payload.agency_id = agencyId;
    }
    saveMutation.mutate(payload);
  };

  const tierBadge = (t: string | null) => {
    if (!t) return null;
    const colors: Record<string, string> = {
      A: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      C: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return <Badge className={colors[t] || ''}>{t}</Badge>;
  };

  const systemBadge = (c: Consultant) => {
    const sys = c.is_team_member ? 'Trainee' : normalizeSystem(c.commission_system);
    if (!sys) return <span className="text-muted-foreground">—</span>;
    const colors: Record<string, string> = {
      RAPP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PURO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Trainee: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return <Badge className={colors[sys] || ''}>{sys}</Badge>;
  };

  const fmt = (v: number | null) => v != null ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v) : '—';

  // Computed tier for form preview
  const formTierLabel = useMemo(() => {
    const sys = commissionSystem;
    if (!sys) return null;
    if (sys === 'PURO') return `PURO → ${hasCompany ? '72.8%' : '70%'}`;
    const acc = parseFloat(accumulated12m) || 0;
    return `${sys} → ${getTierPct(sys, acc, hasCompany)}`;
  }, [commissionSystem, accumulated12m, hasCompany]);

  const showAccumulated = commissionSystem === 'RAPP' || commissionSystem === 'Trainee';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Consultores</h1>
            {unconfirmedCount > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {unconfirmedCount} por confirmar
              </Badge>
            )}
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Consultor
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Escalão</TableHead>
                <TableHead>% Comissão</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Equipa</TableHead>
                <TableHead>Acumulado 12M</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
              ) : consultants.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum consultor encontrado</TableCell></TableRow>
              ) : consultants.map(c => {
                const sys = c.is_team_member ? 'Trainee' : normalizeSystem(c.commission_system);
                const needsConfirm = (sys === 'RAPP' || sys === 'Trainee') && !c.accumulated_12m_confirmed;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.nif || '—'}</TableCell>
                    <TableCell>{tierBadge(c.tier)}</TableCell>
                    <TableCell>{c.commission_pct != null ? `${c.commission_pct}%` : '—'}</TableCell>
                    <TableCell>{systemBadge(c)}</TableCell>
                    <TableCell>{c.team || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{fmt(c.accumulated_12m)}</span>
                        {needsConfirm && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_active ?? true}
                        onCheckedChange={(v) => toggleActive.mutate({ id: c.id, active: v })}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Editar Consultor' : 'Novo Consultor'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>NIF</Label>
              <Input value={nif} onChange={e => setNif(e.target.value)} placeholder="Contribuinte" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Entrada</Label>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Escalão</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sistema de Comissão</Label>
                <Select value={commissionSystem} onValueChange={setCommissionSystem}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RAPP">RAPP</SelectItem>
                    <SelectItem value="PURO">PURO</SelectItem>
                    <SelectItem value="Trainee">Trainee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Membro de Equipa toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Membro de Equipa</Label>
                <p className="text-xs text-muted-foreground">Usa sistema Trainee automaticamente</p>
              </div>
              <Switch
                checked={isTeamMember}
                onCheckedChange={(v) => {
                  setIsTeamMember(v);
                  if (v) setCommissionSystem('Trainee');
                  else setCommissionSystem('RAPP');
                }}
              />
            </div>

            {/* Tem Empresa toggle - only for PURO */}
            {commissionSystem === 'PURO' && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tem Empresa</Label>
                  <p className="text-xs text-muted-foreground">72.8% com empresa · 70% sem empresa</p>
                </div>
                <Switch checked={hasCompany} onCheckedChange={setHasCompany} />
              </div>
            )}

            {commissionSystem !== 'PURO' && (
              <div className="flex items-center justify-between">
                <Label>Tem Empresa</Label>
                <Switch checked={hasCompany} onCheckedChange={setHasCompany} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>% Comissão</Label>
              <Input type="number" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} placeholder="47" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Equipa</Label>
                <Input value={team} onChange={e => setTeam(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Líder de Equipa</Label>
                <Input value={teamLeader} onChange={e => setTeamLeader(e.target.value)} />
              </div>
            </div>

            {/* Acumulado 12M - only for RAPP/Trainee */}
            {showAccumulated && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>Acumulado 12M (€)</Label>
                  <Input
                    type="number"
                    value={accumulated12m}
                    onChange={e => {
                      setAccumulated12m(e.target.value);
                      setAccumulated12mConfirmed(false);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    O valor do Maxwork pode não ser fiável. Confirme manualmente.
                  </p>
                </div>

                {/* Confirm toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Confirmar valor</Label>
                  <Switch
                    checked={accumulated12mConfirmed}
                    onCheckedChange={setAccumulated12mConfirmed}
                  />
                </div>
                {accumulated12mConfirmed ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valor confirmado
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Confirmar valor manualmente
                  </p>
                )}

                {/* Tier preview */}
                {formTierLabel && (
                  <p className="text-xs font-medium text-primary">{formTierLabel}</p>
                )}
              </div>
            )}

            {!showAccumulated && (
              <div className="space-y-1.5">
                <Label>Acumulado 12M (€)</Label>
                <Input type="number" value={accumulated12m} onChange={e => setAccumulated12m(e.target.value)} />
              </div>
            )}

            {/* Tier preview for PURO */}
            {commissionSystem === 'PURO' && formTierLabel && (
              <p className="text-xs font-medium text-primary">{formTierLabel}</p>
            )}

            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? 'A guardar…' : editing ? 'Guardar Alterações' : 'Criar Consultor'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar consultor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende eliminar <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
