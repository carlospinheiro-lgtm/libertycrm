import { useState } from 'react';
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
import { Source, SourceFlow, SourceCategory, sourceCategoryLabels, sourceFlowLabels } from '@/types';
import { toast } from 'sonner';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (source: Omit<Source, 'id' | 'createdAt'>) => void;
}

export function AddSourceDialog({ open, onOpenChange, onAdd }: AddSourceDialogProps) {
  const [name, setName] = useState('');
  const [flow, setFlow] = useState<SourceFlow>('ambos');
  const [category, setCategory] = useState<SourceCategory>('marketing');

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('O nome da origem é obrigatório');
      return;
    }

    onAdd({
      name: name.trim(),
      flow,
      category,
      isActive: true,
      createdBy: 'current-user', // TODO: Get from auth
    });

    toast.success('Origem criada com sucesso');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setFlow('ambos');
    setCategory('marketing');
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Origem</DialogTitle>
          <DialogDescription>
            Crie uma nova origem para rastreio de leads
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Origem *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: LinkedIn, Feira Imobiliária..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Fluxo</Label>
            <Select value={flow} onValueChange={(v) => setFlow(v as SourceFlow)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceFlowLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define em que fluxos esta origem estará disponível
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SourceCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceCategoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Criar Origem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
