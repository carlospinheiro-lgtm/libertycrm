import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

const teamTypes = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'recrutamento', label: 'Recrutamento' },
];

export function AddTeamDialog({ open, onOpenChange, agencyId }: AddTeamDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    team_type: 'comercial',
  });

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
        .insert({
          agency_id: agencyId,
          name: formData.name.trim(),
          nickname: formData.nickname.trim() || null,
          team_type: formData.team_type,
          is_active: true,
          is_synced: false,
        });

      if (error) throw error;

      toast.success('Equipa criada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['teams', agencyId] });
      onOpenChange(false);
      setFormData({ name: '', nickname: '', team_type: 'comercial' });
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Erro ao criar equipa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Equipa</DialogTitle>
          <DialogDescription>
            Criar uma nova equipa para a agência selecionada.
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Equipa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
