import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Objective, ResultObjectiveType } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResultsChartProps {
  objectives: Objective[];
}

// Result type configurations for chart
const resultTypeConfigs: {
  type: ResultObjectiveType;
  label: string;
  shortLabel: string;
  isCurrency?: boolean;
}[] = [
  { type: 'reserva_comprador', label: 'Reservas', shortLabel: 'Reserv.' },
  { type: 'angariacao_reservada', label: 'Angariações', shortLabel: 'Angar.' },
  { type: 'transacao_venda', label: 'Trans. Venda', shortLabel: 'Venda' },
  { type: 'transacao_arrendamento', label: 'Trans. Arrend.', shortLabel: 'Arrend.' },
  { type: 'faturacao_vendas', label: 'Fat. Vendas', shortLabel: 'Fat.V', isCurrency: true },
  { type: 'creditos_formalizados', label: 'Créditos', shortLabel: 'Créd.' },
  { type: 'consultores_integrados', label: 'Agentes', shortLabel: 'Agent.' },
];

export function ResultsChart({ objectives }: ResultsChartProps) {
  const isMobile = useIsMobile();
  
  // Filter only result objectives
  const resultObjectives = objectives.filter(o => o.objectiveCategory === 'result');
  
  // Group by result type instead of flow
  const chartData = resultTypeConfigs.map(config => {
    const typeObjectives = resultObjectives.filter(o => o.resultType === config.type);
    const definido = typeObjectives.reduce((sum, o) => sum + o.targetValue, 0);
    const realizado = typeObjectives.reduce((sum, o) => sum + o.currentValue, 0);
    
    return {
      name: isMobile ? config.shortLabel : config.label,
      fullName: config.label,
      type: config.type,
      Definido: definido,
      Realizado: realizado,
      taxa: definido > 0 ? (realizado / definido) * 100 : 0,
      isCurrency: config.isCurrency,
    };
  }).filter(d => d.Definido > 0); // Only show types with objectives
  
  const getBarColor = (taxa: number) => {
    if (taxa >= 90) return 'hsl(142, 76%, 36%)'; // emerald-600
    if (taxa >= 70) return 'hsl(45, 93%, 47%)'; // amber-500
    return 'hsl(0, 84%, 60%)'; // red-500
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Definido vs Realizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "h-[220px]" : "h-[280px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={isMobile 
                ? { top: 5, right: 10, left: 0, bottom: 5 }
                : { top: 5, right: 30, left: 20, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" hide={isMobile} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={isMobile ? 50 : 100}
                className="text-xs"
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const formatValue = (val: number) => {
                      if (data.isCurrency) {
                        return new Intl.NumberFormat('pt-PT', { 
                          style: 'currency', 
                          currency: 'EUR',
                          notation: val >= 10000 ? 'compact' : 'standard',
                          maximumFractionDigits: 0
                        }).format(val);
                      }
                      return val;
                    };
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold mb-2">{data.fullName}</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Definido:</span>
                            <span className="font-medium">{formatValue(data.Definido)}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Realizado:</span>
                            <span className="font-medium text-emerald-600">{formatValue(data.Realizado)}</span>
                          </p>
                          <p className="flex justify-between gap-4 pt-1 border-t">
                            <span className="text-muted-foreground">Taxa:</span>
                            <span className="font-semibold">{data.taxa.toFixed(1)}%</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {!isMobile && <Legend />}
              <Bar 
                dataKey="Definido" 
                fill="hsl(var(--muted-foreground))" 
                opacity={0.3}
                radius={[0, 4, 4, 0]}
              />
              <Bar dataKey="Realizado" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.taxa)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with status colors */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">≥90% No Alvo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">70-89% Em Curso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">&lt;70% Atenção</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}