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

// Define result types configuration
const resultTypeConfigs: {
  type: ResultObjectiveType;
  label: string;
  icon: string;
  isCurrency?: boolean;
  flows: ObjectiveFlow[];
}[] = [
  { type: 'reserva_comprador', label: 'Reservas', icon: '🛒', flows: ['compradores'] },
  { type: 'angariacao_reservada', label: 'Angariações Reservadas', icon: '🏠', flows: ['vendedores'] },
  { type: 'transacao_venda', label: 'Transações – Venda', icon: '💰', flows: ['geral'] },
  { type: 'transacao_arrendamento', label: 'Transações – Arrendamento', icon: '🔑', flows: ['geral'] },
  { type: 'faturacao_vendas', label: 'Faturação (Vendas)', icon: '💶', isCurrency: true, flows: ['geral'] },
  { type: 'faturacao_arrendamentos', label: 'Faturação (Arrend.)', icon: '💷', isCurrency: true, flows: ['geral'] },
  { type: 'creditos_formalizados', label: 'Créditos Escriturados', icon: '💳', flows: ['intermediacao_credito'] },
  { type: 'consultores_integrados', label: 'Agentes Integrados', icon: '👥', flows: ['recrutamento'] },
];

export function ResultTypeGrid({ objectives, flowFilter = 'all' }: ResultTypeGridProps) {
  const isMobile = useIsMobile();
  
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  // Group objectives by result type
  const groupedByType: ResultTypeData[] = resultTypeConfigs.map(config => {
    // Filter objectives by this result type
    let typeObjectives = resultObjectives.filter(o => o.resultType === config.type);
    
    // Apply flow filter if not 'all'
    if (flowFilter !== 'all') {
      typeObjectives = typeObjectives.filter(o => o.flow === flowFilter || config.flows.includes(flowFilter));
    }
    
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
  }).filter(d => d.count > 0); // Only show types with objectives

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
