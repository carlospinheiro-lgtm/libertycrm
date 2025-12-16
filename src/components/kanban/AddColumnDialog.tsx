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

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, color: string) => void;
}

const colorOptions = [
  { value: 'blue', label: 'Azul', class: 'bg-primary' },
  { value: 'cyan', label: 'Ciano', class: 'bg-info' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-warning' },
  { value: 'green', label: 'Verde', class: 'bg-success' },
  { value: 'red', label: 'Vermelho', class: 'bg-destructive' },
  { value: 'gray', label: 'Cinza', class: 'bg-muted-foreground' },
];

export function AddColumnDialog({ open, onOpenChange, onAdd }: AddColumnDialogProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('blue');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), color);
    setTitle('');
    setColor('blue');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Coluna</DialogTitle>
          <DialogDescription>
            Adicione uma nova coluna ao quadro Kanban.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Nome da Coluna</Label>
            <Input
              id="title"
              placeholder="Ex: Em Análise"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Cor</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${opt.class}`} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!title.trim()}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
