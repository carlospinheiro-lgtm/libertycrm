import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { Objective, ObjectiveFlow, ActivityObjectiveType } from '@/types';
import { ActivityTypeCard, ActivityTypeData } from './ActivityTypeCard';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActivityTypeGridProps {
  objectives: Objective[];
  flowFilter?: ObjectiveFlow | 'all';
}

// Define activity types configuration
const activityTypeConfigs: {
  type: ActivityObjectiveType;
  label: string;
  icon: string;
  flows: ObjectiveFlow[];
}[] = [
  // Vendedores
  { type: 'posicionamento_vendedores', label: 'Prospeção de Clientes', icon: '🔍', flows: ['vendedores'] },
  { type: 'leads_vendedores', label: 'Leads Obtidas', icon: '👤', flows: ['vendedores'] },
  { type: 'chamadas_vendedores', label: 'Chamadas', icon: '📞', flows: ['vendedores'] },
  { type: 'contactos_efetivos_vendedores', label: 'Contactos Efetivos', icon: '🤝', flows: ['vendedores'] },
  { type: 'apresentacoes_servicos', label: 'Apresentações Serviços', icon: '🎯', flows: ['vendedores'] },
  { type: 'seguimentos_vendedores', label: 'Seguimentos', icon: '🔄', flows: ['vendedores'] },
  // Compradores
  { type: 'posicionamento_compradores', label: 'Prospeção de Clientes', icon: '🔍', flows: ['compradores'] },
  { type: 'leads_compradores', label: 'Leads Obtidas', icon: '👤', flows: ['compradores'] },
  { type: 'qualificacao', label: 'Qualificação', icon: '📋', flows: ['compradores'] },
  { type: 'visitas', label: 'Visitas', icon: '👁️', flows: ['compradores'] },
  { type: 'propostas', label: 'Propostas', icon: '📝', flows: ['compradores'] },
  // Recrutamento - 6 atividades completas
  { type: 'prospeccao_leads_recrutamento', label: 'Prospecção de Leads', icon: '🔍', flows: ['recrutamento'] },
  { type: 'leads_obtidas_recrutamento', label: 'Leads Obtidas', icon: '👤', flows: ['recrutamento'] },
  { type: 'contactos_leads_recrutamento', label: 'Contactar Leads', icon: '📞', flows: ['recrutamento'] },
  { type: 'marcar_entrevistas_recrutamento', label: 'Marcar Entrevistas', icon: '📅', flows: ['recrutamento'] },
  { type: 'entrevistas_realizadas', label: 'Fazer Entrevistas', icon: '🎤', flows: ['recrutamento'] },
  { type: 'seguimentos_recrutamento', label: 'Seguir Leads', icon: '🔄', flows: ['recrutamento'] },
  // Intermediação de Crédito - NÃO tem atividades
];

export function ActivityTypeGrid({ objectives, flowFilter = 'all' }: ActivityTypeGridProps) {
  const isMobile = useIsMobile();
  
  const activityObjectives = objectives.filter(o => o.objectiveCategory === 'activity');
  
  // Group objectives by activity type
  const groupedByType: ActivityTypeData[] = activityTypeConfigs.map(config => {
    // Filter objectives by this activity type
    let typeObjectives = activityObjectives.filter(o => o.activityType === config.type);
    
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
    definido: groupedByType.reduce((sum, d) => sum + d.definido, 0),
    realizado: groupedByType.reduce((sum, d) => sum + d.realizado, 0),
    falta: groupedByType.reduce((sum, d) => sum + d.falta, 0),
    taxa: 0,
  };
  totals.taxa = totals.definido > 0 ? (totals.realizado / totals.definido) * 100 : 0;

  if (groupedByType.length === 0) {
    return (
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="py-8 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-blue-500/50" />
          <p className="text-muted-foreground">Nenhuma atividade definida</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-700">Objetivos de Atividade</h2>
            <p className="text-sm text-blue-600/70">Esforço e execução diária: Prospeção, Leads, Contactos, Visitas</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-blue-500/10">
            <p className="text-lg font-bold text-blue-600">{totals.definido}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Definido</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-blue-500/10">
            <p className="text-lg font-bold text-blue-700">{totals.realizado}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Realizado</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-blue-500/10">
            <p className="text-lg font-bold text-amber-600">{totals.falta}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Falta</p>
          </div>
          <div className="bg-white/60 rounded-lg py-2 px-2 text-center border border-blue-500/10">
            <p className={cn(
              "text-lg font-bold",
              totals.taxa >= 70 ? 'text-blue-600' : 'text-red-600'
            )}>
              {totals.taxa.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Taxa</p>
          </div>
        </div>
      </div>

      {/* Activity Type Cards Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {groupedByType.map(data => (
          <ActivityTypeCard key={data.type} data={data} />
        ))}
      </div>
    </div>
  );
}
