import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Objective, ObjectiveFlow, ResultObjectiveType } from '@/types';
import { ResultTypeCard, ResultTypeData } from './ResultTypeCard';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResultTypeGridProps {
  objectives: Objective[];
  flowFilter?: ObjectiveFlow | 'all';
}

// Define result types configuration - UPDATED: Removed transações, added new vendedores types
const resultTypeConfigs: {
  type: ResultObjectiveType;
  label: string;
  icon: string;
  isCurrency?: boolean;
  flows: ObjectiveFlow[];
}[] = [
  // Vendedores - Angariações
  { type: 'angariacao_exclusiva', label: 'Angariações (Exclusivo)', icon: '🏠', flows: ['vendedores'] },
  { type: 'angariacao_exclusiva_rede', label: 'Angariações (Exclusivo Rede)', icon: '🏘️', flows: ['vendedores'] },
  { type: 'angariacao_reservada', label: 'Angariações Reservadas', icon: '✅', flows: ['vendedores'] },
  // Vendedores - Faturação (derivada de reservas/angariações)
  { type: 'faturacao_vendas', label: 'Faturação (Vendas)', icon: '💶', isCurrency: true, flows: ['vendedores'] },
  { type: 'faturacao_arrendamentos', label: 'Faturação (Arrendamentos)', icon: '💷', isCurrency: true, flows: ['vendedores'] },
  // Compradores
  { type: 'reserva_comprador', label: 'Reservas', icon: '🛒', flows: ['compradores'] },
  // Intermediação de Crédito
  { type: 'creditos_formalizados', label: 'Créditos Escriturados', icon: '💳', flows: ['intermediacao_credito'] },
  // Recrutamento
  { type: 'consultores_integrados', label: 'Agentes Integrados', icon: '👥', flows: ['recrutamento'] },
];

export function ResultTypeGrid({ objectives, flowFilter = 'all' }: ResultTypeGridProps) {
  const isMobile = useIsMobile();
  
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  // Group objectives by result type with simplified filter logic
  const groupedByType: ResultTypeData[] = resultTypeConfigs
    // First filter configs by flow - when flowFilter is set, only show cards that belong to that flow
    .filter(config => {
      if (flowFilter === 'all') return true;
      // Simple check: card.flows includes the selected flow
      return config.flows.includes(flowFilter);
    })
    .map(config => {
      // Get objectives for this result type
      const typeObjectives = resultObjectives.filter(o => o.resultType === config.type);
      
      const definido = typeObjectives.reduce((sum, o) => sum + o.targetValue, 0);
      const realizado = typeObjectives.reduce((sum, o) => sum + o.currentValue, 0);
      const falta = Math.max(0, definido - realizado);
      const taxa = definido > 0 ? (realizado / definido) * 100 : 0;
      
      return {
        type: config.type,
        label: config.label,
        icon: config.icon,
        isCurrency: config.isCurrency,
        flows: config.flows,
        definido,
        realizado,
        falta,
        taxa,
        count: typeObjectives.length,
      };
    })
    // Show cards even with count 0 when a specific flow is selected (so user sees all available card types)
    .filter(d => flowFilter !== 'all' || d.count > 0);

  // Calculate totals
  const totals = {
    definido: groupedByType.filter(d => !d.isCurrency).reduce((sum, d) => sum + d.definido, 0),
    realizado: groupedByType.filter(d => !d.isCurrency).reduce((sum, d) => sum + d.realizado, 0),
    falta: groupedByType.filter(d => !d.isCurrency).reduce((sum, d) => sum + d.falta, 0),
    taxa: 0,
  };
  totals.taxa = totals.definido > 0 ? (totals.realizado / totals.definido) * 100 : 0;

  if (groupedByType.length === 0) {
    return (
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardContent className="py-8 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-emerald-500/50" />
          <p className="text-muted-foreground">Nenhum resultado definido</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-700">Objetivos de Resultado</h2>
            <p className="text-sm text-emerald-600/70">Concretização e fecho: Reservas, Angariações, Transações, Faturação</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-emerald-500/10">
            <p className="text-lg font-bold text-emerald-600">{totals.definido}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Definido</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-emerald-500/10">
            <p className="text-lg font-bold text-emerald-700">{totals.realizado}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-emerald-500/10">
            <p className="text-lg font-bold text-amber-600">{totals.falta}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Falta</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-emerald-500/10">
            <p className={cn(
              "text-lg font-bold",
              totals.taxa >= 70 ? 'text-emerald-600' : 'text-red-600'
            )}>
              {totals.taxa.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Taxa</p>
          </div>
        </div>
      </div>

      {/* Result Type Cards Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {groupedByType.map(data => (
          <ResultTypeCard key={data.type} data={data} />
        ))}
      </div>
    </div>
  );
}
