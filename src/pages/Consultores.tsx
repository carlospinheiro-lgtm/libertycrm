import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserCheck, Plus, Pencil, Trash2 } from 'lucide-react';
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

  const saveMutation = useMutation({
    mutationFn: async (payload: Database['public']['Tables']['consultants']['Insert'] | (Database['public']['Tables']['consultants']['Update'] & { id: string })) => {
      if (editing) {
        const { id, ...rest } = payload as any;
        const { error } = await supabase.from('consultants').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('consultants').insert(payload as Database['public']['Tables']['consultants']['Insert']);
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
    setAccumulated12m('0'); setIsActive(true);
  };

  const openCreate = () => { resetForm(); setEditing(null); setSheetOpen(true); };

  const openEdit = (c: Consultant) => {
    setEditing(c);
    setName(c.name); setNif(c.nif || ''); setEntryDate(c.entry_date || '');
    setTier(c.tier || ''); setCommissionSystem(c.commission_system || '');
    setCommissionPct(c.commission_pct != null ? String(c.commission_pct) : '');
    setHasCompany(c.has_company ?? false); setTeam(c.team || ''); setTeamLeader(c.team_leader || '');
    setAccumulated12m(c.accumulated_12m != null ? String(c.accumulated_12m) : '0');
    setIsActive(c.is_active ?? true);
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

  const fmt = (v: number | null) => v != null ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v) : '—';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Consultores</h1>
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
              ) : consultants.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.nif || '—'}</TableCell>
                  <TableCell>{tierBadge(c.tier)}</TableCell>
                  <TableCell>{c.commission_pct != null ? `${c.commission_pct}%` : '—'}</TableCell>
                  <TableCell>{c.commission_system || '—'}</TableCell>
                  <TableCell>{c.team || '—'}</TableCell>
                  <TableCell>{fmt(c.accumulated_12m)}</TableCell>
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
              ))}
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
                    <SelectItem value="Alternativo">Alternativo</SelectItem>
                    <SelectItem value="Fixo">Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>% Comissão</Label>
              <Input type="number" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} placeholder="47" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tem Empresa</Label>
              <Switch checked={hasCompany} onCheckedChange={setHasCompany} />
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
            <div className="space-y-1.5">
              <Label>Acumulado 12M (€)</Label>
              <Input type="number" value={accumulated12m} onChange={e => setAccumulated12m(e.target.value)} />
            </div>
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
