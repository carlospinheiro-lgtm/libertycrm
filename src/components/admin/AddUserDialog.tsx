import { useState } from 'react';
import { agencies, teams } from '@/data/rbac-data';
import { roleLabels, AppRole } from '@/types/rbac';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allRoles: AppRole[] = [
  'diretor_geral',
  'diretor_agencia',
  'diretor_comercial',
  'lider_equipa',
  'agente_imobiliario',
  'assistente_agente',
  'assistente_equipa',
  'assistente_direcao',
  'diretor_financeiro',
  'coordenadora_loja',
  'gestor_marketing',
  'diretor_rh',
  'recrutador',
  'diretor_processual',
  'gestor_processual',
];

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  const filteredTeams = teams.filter(t => t.agencyId === agencyId);

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !agencyId || selectedRoles.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Em produção, isto faria uma chamada à API
    console.log('Creating user:', { name, email, phone, agencyId, teamId, roles: selectedRoles });
    
    toast.success('Utilizador criado com sucesso');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAgencyId('');
    setTeamId('');
    setSelectedRoles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Utilizador</DialogTitle>
          <DialogDescription>
            Crie um novo utilizador e atribua funções
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.pt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="912345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency">Agência *</Label>
            <Select value={agencyId} onValueChange={(v) => { setAgencyId(v); setTeamId(''); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar agência" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map(agency => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {agencyId && filteredTeams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="team">Equipa</Label>
              <Select value={teamId || "_none_"} onValueChange={(v) => setTeamId(v === "_none_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar equipa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sem equipa</SelectItem>
                  {filteredTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Funções * (selecionar pelo menos uma)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
              {allRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <label
                    htmlFor={role}
                    className="text-sm cursor-pointer"
                  >
                    {roleLabels[role]}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Utilizador</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
