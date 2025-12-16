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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KanbanColumn } from '@/hooks/useKanbanState';

interface MoveLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  columns: KanbanColumn[];
  currentColumnId: string;
  targetColumnId?: string;
  onConfirm: (columnId: string, nextActivityDate: string, nextActivityDescription: string) => void;
  onCancel: () => void;
}

export function MoveLeadDialog({
  open,
  onOpenChange,
  leadName,
  columns,
  currentColumnId,
  targetColumnId,
  onConfirm,
  onCancel,
}: MoveLeadDialogProps) {
  const [selectedColumn, setSelectedColumn] = useState(targetColumnId || currentColumnId);
  const [activityDate, setActivityDate] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const handleConfirm = () => {
    if (!activityDate) return;
    onConfirm(selectedColumn, activityDate, activityDescription);
    setActivityDate('');
    setActivityDescription('');
  };

  const handleCancel = () => {
    onCancel();
    setActivityDate('');
    setActivityDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mover Lead</DialogTitle>
          <DialogDescription>
            A mover <span className="font-semibold">{leadName}</span>. Defina a data da próxima atividade.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!targetColumnId && (
            <div className="grid gap-2">
              <Label htmlFor="column">Coluna de Destino</Label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(c => c.id !== currentColumnId).map(column => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="date">Data da Próxima Atividade *</Label>
            <Input
              id="date"
              type="datetime-local"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição da Atividade</Label>
            <Textarea
              id="description"
              placeholder="Ex: Ligar para confirmar visita..."
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!activityDate}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
