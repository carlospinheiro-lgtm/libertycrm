import { useState } from 'react';
import { z } from 'zod';
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
import { useCreateAgency } from '@/hooks/useAgenciesCrud';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const agencySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  remax_code: z.string().max(20).optional(),
});

interface AddAgencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgencyDialog({ open, onOpenChange }: AddAgencyDialogProps) {
  const [name, setName] = useState('');
  const [remaxCode, setRemaxCode] = useState('');
  const [errors, setErrors] = useState<{ name?: string; remax_code?: string }>({});
  
  const createAgency = useCreateAgency();
  
  const resetForm = () => {
    setName('');
    setRemaxCode('');
    setErrors({});
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const handleSubmit = async () => {
    const validation = agencySchema.safeParse({ 
      name: name.trim(), 
      remax_code: remaxCode.trim() || undefined 
    });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    try {
      await createAgency.mutateAsync({
        name: name.trim(),
        remax_code: remaxCode.trim() || null,
        is_active: true,
      });
      
      toast.success('Agência criada com sucesso');
      handleClose();
    } catch (error: any) {
      toast.error(`Erro ao criar agência: ${error.message}`);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Agência</DialogTitle>
          <DialogDescription>
            Crie uma nova agência na plataforma
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agency-name">Nome da Agência *</Label>
            <Input
              id="agency-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Ex: RE/MAX Liberty Braga"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remax-code">Código RE/MAX (opcional)</Label>
            <Input
              id="remax-code"
              value={remaxCode}
              onChange={(e) => setRemaxCode(e.target.value)}
              placeholder="Ex: LIB-BRA"
            />
            {errors.remax_code && (
              <p className="text-sm text-destructive">{errors.remax_code}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createAgency.isPending}
          >
            {createAgency.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Agência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
