import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useCreateFinancialItem } from '@/hooks/useProjectFinancials';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { FinancialItemType, financialItemTypeLabels } from '@/types/projects';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AddFinancialItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  type: FinancialItemType;
}

export function AddFinancialItemDialog({ open, onOpenChange, projectId, type }: AddFinancialItemDialogProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [plannedValue, setPlannedValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [dateExpected, setDateExpected] = useState<Date | undefined>();
  const [vendorOrClient, setVendorOrClient] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');

  const createItem = useCreateFinancialItem();
  const { data: members } = useProjectMembers(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) return;

    createItem.mutate({
      project_id: projectId,
      type,
      category,
      description: description || undefined,
      planned_value: plannedValue ? parseFloat(plannedValue) : 0,
      actual_value: actualValue ? parseFloat(actualValue) : 0,
      date_expected: dateExpected ? format(dateExpected, 'yyyy-MM-dd') : undefined,
      vendor_or_client: vendorOrClient || undefined,
      responsible_user_id: responsibleUserId || undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setCategory('');
    setDescription('');
    setPlannedValue('');
    setActualValue('');
    setDateExpected(undefined);
    setVendorOrClient('');
    setResponsibleUserId('');
    setNotes('');
  };

  const isRevenue = type === 'revenue';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isRevenue ? 'Nova Receita' : 'Novo Custo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Rubrica *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={isRevenue ? 'Ex: Venda de Serviços' : 'Ex: Marketing Digital'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedValue">Valor Previsto (€)</Label>
              <Input
                id="plannedValue"
                type="number"
                step="0.01"
                min="0"
                value={plannedValue}
                onChange={(e) => setPlannedValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualValue">Valor Real (€)</Label>
              <Input
                id="actualValue"
                type="number"
                step="0.01"
                min="0"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateExpected && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateExpected ? format(dateExpected, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateExpected}
                    onSelect={setDateExpected}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorOrClient">{isRevenue ? 'Cliente' : 'Fornecedor'}</Label>
              <Input
                id="vendorOrClient"
                value={vendorOrClient}
                onChange={(e) => setVendorOrClient(e.target.value)}
                placeholder={isRevenue ? 'Nome do cliente' : 'Nome do fornecedor'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável</Label>
            <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {members?.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.user?.name || member.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createItem.isPending || !category}>
              {createItem.isPending ? 'A criar...' : `Criar ${financialItemTypeLabels[type]}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
