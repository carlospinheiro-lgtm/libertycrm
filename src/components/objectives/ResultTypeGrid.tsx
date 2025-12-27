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
      <Card className="bg-muted/30">
        <CardContent className="py-8 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhum resultado definido</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Resumo de Resultados</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-background/60 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-primary">{totals.definido}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Definido</p>
            </div>
            <div className="bg-background/60 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-emerald-600">{totals.realizado}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
            </div>
            <div className="bg-background/60 rounded-lg py-2 px-1">
              <p className="text-lg font-bold text-amber-600">{totals.falta}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Falta</p>
            </div>
            <div className="bg-background/60 rounded-lg py-2 px-1">
              <p className={cn(
                "text-lg font-bold",
                totals.taxa >= 70 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {totals.taxa.toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Taxa</p>
            </div>
          </div>
        </CardContent>
      </Card>

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