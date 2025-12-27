import { useState, useEffect } from 'react';
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
import { Source, SourceFlow, SourceCategory, SourceType, sourceCategoryLabels, sourceFlowLabels, sourceTypeLabels } from '@/types';
import { toast } from 'sonner';

interface EditSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: Source;
  onSave: (id: string, updates: Partial<Source>) => void;
}

export function EditSourceDialog({ open, onOpenChange, source, onSave }: EditSourceDialogProps) {
  const [name, setName] = useState(source.name);
  const [flow, setFlow] = useState<SourceFlow>(source.flow);
  const [sourceType, setSourceType] = useState<SourceType>(source.sourceType || 'passiva');
  const [category, setCategory] = useState<SourceCategory>(source.category);

  useEffect(() => {
    setName(source.name);
    setFlow(source.flow);
    setSourceType(source.sourceType || 'passiva');
    setCategory(source.category);
  }, [source]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('O nome da origem é obrigatório');
      return;
    }

    onSave(source.id, {
      name: name.trim(),
      flow,
      sourceType,
      category,
    });

    toast.success('Origem atualizada com sucesso');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Origem</DialogTitle>
          <DialogDescription>
            Atualize os dados da origem
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

          <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Origem</Label>
              <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sourceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
