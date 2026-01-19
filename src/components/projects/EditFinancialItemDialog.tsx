import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useUpdateFinancialItem } from '@/hooks/useProjectFinancials';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { ProjectFinancialItem, financialItemTypeLabels } from '@/types/projects';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditFinancialItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ProjectFinancialItem;
  projectId: string;
}

export function EditFinancialItemDialog({ open, onOpenChange, item, projectId }: EditFinancialItemDialogProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [plannedValue, setPlannedValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [dateExpected, setDateExpected] = useState<Date | undefined>();
  const [dateReal, setDateReal] = useState<Date | undefined>();
  const [vendorOrClient, setVendorOrClient] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');

  const updateItem = useUpdateFinancialItem();
  const { data: members } = useProjectMembers(projectId);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setDescription(item.description || '');
      setPlannedValue(item.planned_value?.toString() || '');
      setActualValue(item.actual_value?.toString() || '');
      setDateExpected(item.date_expected ? new Date(item.date_expected) : undefined);
      setDateReal(item.date_real ? new Date(item.date_real) : undefined);
      setVendorOrClient(item.vendor_or_client || '');
      setResponsibleUserId(item.responsible_user_id || '');
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) return;

    updateItem.mutate({
      id: item.id,
      projectId,
      category,
      description: description || undefined,
      planned_value: plannedValue ? parseFloat(plannedValue) : 0,
      actual_value: actualValue ? parseFloat(actualValue) : 0,
      date_expected: dateExpected ? format(dateExpected, 'yyyy-MM-dd') : undefined,
      date_real: dateReal ? format(dateReal, 'yyyy-MM-dd') : undefined,
      vendor_or_client: vendorOrClient || undefined,
      responsible_user_id: responsibleUserId || undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const isRevenue = item.type === 'revenue';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Editar {financialItemTypeLabels[item.type]}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Rubrica *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              <Label>Data Real</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateReal && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateReal ? format(dateReal, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateReal}
                    onSelect={setDateReal}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorOrClient">{isRevenue ? 'Cliente' : 'Fornecedor'}</Label>
            <Input
              id="vendorOrClient"
              value={vendorOrClient}
              onChange={(e) => setVendorOrClient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável</Label>
            <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
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
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateItem.isPending || !category}>
              {updateItem.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
