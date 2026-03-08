import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Building2, Users, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  max_agencies: number;
  max_users: number;
  billing_email: string | null;
  created_at: string;
  agency_count?: number;
  user_count?: number;
}

export default function SuperAdmin() {
  const { isSuperAdmin, isLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    billing_email: '',
    plan: 'starter',
    max_agencies: 5,
    max_users: 20,
  });

  const fetchOrgs = async () => {
    setLoading(true);
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!orgsData) { setLoading(false); return; }

    // Get counts per org
    const enriched: Organization[] = await Promise.all(
      orgsData.map(async (org: any) => {
        const { count: agencyCount } = await supabase
          .from('agencies')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Count distinct users across all agencies of this org
        const { data: agencyIds } = await supabase
          .from('agencies')
          .select('id')
          .eq('organization_id', org.id);

        let userCount = 0;
        if (agencyIds && agencyIds.length > 0) {
          const ids = agencyIds.map((a: any) => a.id);
          const { count } = await supabase
            .from('user_agencies')
            .select('user_id', { count: 'exact', head: true })
            .in('agency_id', ids)
            .eq('is_active', true);
          userCount = count || 0;
        }

        return {
          ...org,
          agency_count: agencyCount || 0,
          user_count: userCount,
        };
      })
    );

    setOrgs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) fetchOrgs();
  }, [isSuperAdmin]);

  if (isLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleCreate = async () => {
    if (!form.name || !form.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    const { error } = await supabase.from('organizations').insert({
      name: form.name,
      slug: form.slug,
      billing_email: form.billing_email || null,
      plan: form.plan,
      max_agencies: form.max_agencies,
      max_users: form.max_users,
    });

    if (error) {
      toast.error('Erro ao criar organização: ' + error.message);
      return;
    }

    toast.success('Organização criada com sucesso');
    setDialogOpen(false);
    setForm({ name: '', slug: '', billing_email: '', plan: 'starter', max_agencies: 5, max_users: 20 });
    fetchOrgs();
  };

  const toggleActive = async (org: Organization) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !org.is_active })
      .eq('id', org.id);

    if (error) {
      toast.error('Erro ao atualizar estado');
      return;
    }

    toast.success(org.is_active ? 'Organização suspensa' : 'Organização ativada');
    fetchOrgs();
  };

  const planBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-300 hover:bg-amber-500/30">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-300 hover:bg-blue-500/30">Pro</Badge>;
      default:
        return <Badge variant="secondary">Starter</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">Super Admin</h1>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Organização
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Organizações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orgs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Agências</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                {orgs.reduce((sum, o) => sum + (o.agency_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Utilizadores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                {orgs.reduce((sum, o) => sum + (o.user_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-center">Agências</TableHead>
                  <TableHead className="text-center">Utilizadores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      A carregar...
                    </TableCell>
                  </TableRow>
                ) : orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma organização encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                      <TableCell>{planBadge(org.plan)}</TableCell>
                      <TableCell className="text-center">
                        {org.agency_count}/{org.max_agencies}
                      </TableCell>
                      <TableCell className="text-center">
                        {org.user_count}/{org.max_users}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.is_active ? 'success' : 'destructive'}>
                          {org.is_active ? 'Ativo' : 'Suspenso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={org.is_active}
                            onCheckedChange={() => toggleActive(org)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Organization Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Organização</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) });
                  }}
                  placeholder="Ex: Liberty Group"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="liberty-group"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email de faturação</label>
                <Input
                  type="email"
                  value={form.billing_email}
                  onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                  placeholder="billing@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Plano</label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Máx. agências</label>
                  <Input
                    type="number"
                    value={form.max_agencies}
                    onChange={(e) => setForm({ ...form, max_agencies: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Máx. utilizadores</label>
                  <Input
                    type="number"
                    value={form.max_users}
                    onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar Organização</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
