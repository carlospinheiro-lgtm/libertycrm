import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, ArrowRight, Home, Wallet, Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AddResultDialog } from './AddResultDialog';
import { ObjectiveFlow, ObjectiveCategory, objectiveFlowLabels, objectiveCategoryLabels } from '@/types';

// Mock data - TODO: Connect to database
const updatesMock = [
  {
    id: '1',
    type: 'angariacao' as const,
    flow: 'vendedores' as ObjectiveFlow,
    objectiveCategory: 'result' as ObjectiveCategory,
    description: 'Nova angariação registada',
    value: '+1',
    objectiveName: 'Angariações Reservadas',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'reserva' as const,
    flow: 'compradores' as ObjectiveFlow,
    objectiveCategory: 'result' as ObjectiveCategory,
    description: 'Reserva confirmada - Apartamento T3',
    value: '+€8.500',
    objectiveName: 'Reservas',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'lead' as const,
    flow: 'vendedores' as ObjectiveFlow,
    objectiveCategory: 'activity' as ObjectiveCategory,
    description: 'Posicionamento registado',
    value: '+5',
    objectiveName: 'Posicionamento',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'lead' as const,
    flow: 'compradores' as ObjectiveFlow,
    objectiveCategory: 'activity' as ObjectiveCategory,
    description: 'Visita realizada',
    value: '+1',
    objectiveName: 'Visitas',
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

function getFlowBadgeColor(flow: ObjectiveFlow): string {
  switch (flow) {
    case 'vendedores':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'compradores':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'recrutamento':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    case 'intermediacao_credito':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'geral':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  }
}

function getCategoryBadgeColor(category: ObjectiveCategory): string {
  return category === 'activity' 
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
}

export function ObjectivesTracking() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleGoToObjectives = () => {
    navigate('/objetivos');
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
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getFlowBadgeColor(update.flow)}`}>
                        {objectiveFlowLabels[update.flow]}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getCategoryBadgeColor(update.objectiveCategory)}`}>
                        {objectiveCategoryLabels[update.objectiveCategory]}
                      </Badge>
                    </div>
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