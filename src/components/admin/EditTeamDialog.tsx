import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/hooks/useTeamsSupabase';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditTeamDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const teamTypes = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'recrutamento', label: 'Recrutamento' },
];

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    nickname: team.nickname || '',
    team_type: team.team_type || 'comercial',
    is_active: team.is_active ?? true,
  });

  useEffect(() => {
    setFormData({
      name: team.name,
      nickname: team.nickname || '',
      team_type: team.team_type || 'comercial',
      is_active: team.is_active ?? true,
    });
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('O nome da equipa é obrigatório');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || null,
          team_type: formData.team_type,
          is_active: formData.is_active,
        })
        .eq('id', team.id);

      if (error) throw error;

      toast.success('Equipa atualizada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['teams', team.agency_id] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Erro ao atualizar equipa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Equipa</DialogTitle>
          <DialogDescription>
            Atualizar informações da equipa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Equipa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Equipa Alpha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido / Nickname</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="Ex: Alpha"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_type">Tipo de Equipa</Label>
            <Select 
              value={formData.team_type} 
              onValueChange={(value) => setFormData({ ...formData, team_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {teamTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Equipa Ativa</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
