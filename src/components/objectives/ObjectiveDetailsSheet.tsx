import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';
import { Target, Calendar, TrendingUp, Home, Wallet, Star, User, ClipboardList } from 'lucide-react';
import { Objective, getObjectiveTypeName, objectiveFlowLabels, objectiveCategoryLabels } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ObjectiveDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective | null;
}

// Mock history data - TODO: Connect to database
const historyMock = [
  { date: '01/12', value: 95000 },
  { date: '08/12', value: 102000 },
  { date: '15/12', value: 112000 },
  { date: '22/12', value: 125000 },
];

// Mock updates - TODO: Connect to database
const updatesMock = [
  {
    id: '1',
    type: 'reserva' as const,
    description: 'Reserva confirmada - Apartamento T3',
    value: '+€8.500',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'reserva' as const,
    description: 'Reserva confirmada - Moradia T4',
    value: '+€12.000',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'pontos' as const,
    description: 'Comissão de venda',
    value: '+€5.000',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
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

function formatValue(value: number, unit: string, unitSymbol: string): string {
  if (unit === 'currency') {
    return `${unitSymbol}${value.toLocaleString('pt-PT')}`;
  }
  if (unitSymbol) {
    return `${value.toLocaleString('pt-PT')} ${unitSymbol}`;
  }
  return value.toLocaleString('pt-PT');
}

function getStatusBadge(percentage: number) {
  if (percentage >= 90) {
    return { label: 'No alvo', variant: 'success' as const };
  }
  if (percentage >= 70) {
    return { label: 'Em curso', variant: 'warning' as const };
  }
  return { label: 'Atenção', variant: 'destructive' as const };
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '[&>div]:bg-success';
  if (percentage >= 70) return '[&>div]:bg-warning';
  return '[&>div]:bg-destructive';
}

export function ObjectiveDetailsSheet({ open, onOpenChange, objective }: ObjectiveDetailsSheetProps) {
  if (!objective) return null;

  const percentage = Math.round((objective.currentValue / objective.targetValue) * 100);
  const status = getStatusBadge(percentage);
  const typeName = getObjectiveTypeName(objective);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading">
            <Target className="h-5 w-5 text-primary" />
            {typeName}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Flow and Category badges */}
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {objectiveFlowLabels[objective.flow]}
            </Badge>
            <Badge variant="outline" className="bg-secondary">
              {objectiveCategoryLabels[objective.objectiveCategory]}
            </Badge>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            
            <Progress 
              value={Math.min(percentage, 100)} 
              className={`h-3 ${getProgressColor(percentage)}`} 
            />
            
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {formatValue(objective.currentValue, objective.unit, objective.unitSymbol)}
              </span>
              <span className="text-muted-foreground">
                de {formatValue(objective.targetValue, objective.unit, objective.unitSymbol)}
              </span>
            </div>
            
            <div className="text-center">
              <span className="text-3xl font-bold">{percentage}%</span>
            </div>
          </div>

          <Separator />

          {/* Assignment */}
          {objective.targetName && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Atribuição</span>
                <span className="font-medium">
                  {objective.targetType === 'agent' ? 'Agente: ' : 'Agência: '}
                  {objective.targetName}
                </span>
              </div>
              <Separator />
            </>
          )}

          {/* Period */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(objective.startDate, 'dd MMM yyyy', { locale: pt })}
              {' - '}
              {format(objective.endDate, 'dd MMM yyyy', { locale: pt })}
            </span>
          </div>

          <Separator />

          {/* Chart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Evolução</span>
            </div>
            
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyMock}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                    tickFormatter={(value) => objective.unit === 'currency' ? `€${(value / 1000).toFixed(0)}k` : value.toString()}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      formatValue(value, objective.unit, objective.unitSymbol), 
                      'Valor'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Separator />

          {/* Recent Updates */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Últimas Atualizações</span>
            
            <div className="space-y-3">
              {updatesMock.map((update) => {
                const Icon = typeIcons[update.type] || ClipboardList;
                
                return (
                  <div key={update.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <div className="mt-0.5 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{update.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-success">{update.value}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(update.createdAt, { addSuffix: true, locale: pt })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}