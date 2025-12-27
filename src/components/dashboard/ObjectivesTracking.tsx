import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Plus, ArrowRight, Home, Wallet, Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AddResultDialog } from './AddResultDialog';
import { toast } from 'sonner';

// Mock data - TODO: Connect to database
const updatesMock = [
  {
    id: '1',
    type: 'angariacao' as const,
    description: 'Nova angariação registada',
    value: '+1',
    objectiveName: 'Novas Angariações',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'reserva' as const,
    description: 'Reserva confirmada - Apartamento T3',
    value: '+€8.500',
    objectiveName: 'Faturação Trimestral Q4',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'pontos' as const,
    description: 'Pontos de equipa atualizados',
    value: '+250 pts',
    objectiveName: 'Pontos de Equipa',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'lead' as const,
    description: 'Lead qualificada para compra',
    value: '+1',
    objectiveName: 'Leads Qualificadas',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
];

const typeIcons = {
  angariacao: Home,
  reserva: Wallet,
  pontos: Star,
  lead: User,
  transacao: Wallet,
  outro: ClipboardList,
};

const typeColors = {
  angariacao: 'text-primary',
  reserva: 'text-success',
  pontos: 'text-warning',
  lead: 'text-info',
  transacao: 'text-success',
  outro: 'text-muted-foreground',
};

export function ObjectivesTracking() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGoToObjectives = () => {
    toast.info('Página de Objetivos em desenvolvimento');
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-heading">Acompanhamento</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleGoToObjectives}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {updatesMock.map((update) => {
              const Icon = typeIcons[update.type] || ClipboardList;
              const colorClass = typeColors[update.type] || 'text-muted-foreground';
              
              return (
                <div key={update.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className={`mt-0.5 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{update.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">{update.value}</span>
                      <span>•</span>
                      <span className="truncate">{update.objectiveName}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(update.createdAt, { addSuffix: true, locale: pt })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddResultDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
