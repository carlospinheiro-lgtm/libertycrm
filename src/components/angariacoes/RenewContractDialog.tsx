import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEndDate: string | null;
  onSubmit: (newEndDate: string, months: number) => void;
}

export function RenewContractDialog({ open, onOpenChange, currentEndDate, onSubmit }: RenewContractDialogProps) {
  const [months, setMonths] = useState(6);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (months < 4) {
      setError('O contrato de mediação tem uma duração mínima de 4 meses.');
      return;
    }
    const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + months);
    onSubmit(newDate.toISOString().split('T')[0], months);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Contrato</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Duração da Renovação (meses)</Label>
            <Input
              type="number"
              min={4}
              value={months}
              onChange={e => {
                setMonths(parseInt(e.target.value) || 4);
                setError('');
              }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Renovar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
