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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LogVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    visit_date: string;
    buyer_name: string;
    buyer_contact: string;
    outcome: string;
    feedback: string;
  }) => void;
}

export function LogVisitDialog({ open, onOpenChange, onSubmit }: LogVisitDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [outcome, setOutcome] = useState('medium_interest');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    onSubmit({
      visit_date: new Date(date).toISOString(),
      buyer_name: buyerName,
      buyer_contact: buyerContact,
      outcome,
      feedback,
    });
    setBuyerName('');
    setBuyerContact('');
    setFeedback('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar Visita</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Data & Hora</Label>
            <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Nome do Comprador</Label>
            <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} />
          </div>
          <div>
            <Label>Contacto</Label>
            <Input value={buyerContact} onChange={e => setBuyerContact(e.target.value)} />
          </div>
          <div>
            <Label>Resultado</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high_interest">Interesse Alto</SelectItem>
                <SelectItem value="medium_interest">Interesse Médio</SelectItem>
                <SelectItem value="no_interest">Sem Interesse</SelectItem>
                <SelectItem value="offer_expected">Proposta Esperada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Feedback / Notas</Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
