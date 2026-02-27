import { DbProperty } from '@/hooks/useProperties';
import { ChecklistItem } from '@/hooks/usePropertyChecklist';
import { PropertyChecklist } from './PropertyChecklist';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface PropertyStageKanbanProps {
  property: DbProperty;
  checklistItems: ChecklistItem[];
  onToggleChecklist: (id: string, completed: boolean) => void;
  onStageChange: (stage: string) => void;
}

const STAGES = [
  { id: 'documentos', label: 'Recolha de Documentos', bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  { id: 'avaliacao', label: 'Avaliação', bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
  { id: 'publicacao', label: 'Publicação', bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-700' },
  { id: 'visitas', label: 'Visitas', bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  { id: 'negociacao', label: 'Negociação', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
];

export function PropertyStageKanban({ property, checklistItems, onToggleChecklist, onStageChange }: PropertyStageKanbanProps) {
  const currentIdx = STAGES.findIndex(s => s.id === property.current_stage);

  const getStageProgress = (stageId: string) => {
    const items = checklistItems.filter(i => i.stage === stageId && !i.is_optional);
    if (items.length === 0) return 100;
    return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
  };

  const daysInStage = property.stage_entered_at
    ? differenceInDays(new Date(), new Date(property.stage_entered_at))
    : 0;

  return (
    <div className="space-y-4">
      {/* Stage timeline */}
      <div className="flex gap-1">
        {STAGES.map((stage, idx) => {
          const isCurrent = stage.id === property.current_stage;
          const isPast = idx < currentIdx;
          const progress = getStageProgress(stage.id);

          return (
            <button
              key={stage.id}
              onClick={() => onStageChange(stage.id)}
              className={cn(
                'flex-1 p-2 rounded-lg border-2 text-center transition-all text-xs',
                isCurrent ? `${stage.bg} ${stage.border} ${stage.text} font-semibold` :
                isPast ? 'bg-muted/50 border-muted text-muted-foreground' :
                'bg-card border-border text-muted-foreground opacity-60'
              )}
            >
              <p className="truncate">{stage.label}</p>
              <Progress value={isPast ? 100 : progress} className="h-1 mt-1" />
            </button>
          );
        })}
      </div>

      {/* Current stage card */}
      <div className={cn(
        'rounded-xl border-2 p-4',
        STAGES[currentIdx]?.bg,
        STAGES[currentIdx]?.border
      )}>
        <div className="flex items-center gap-3 mb-3">
          {property.cover_photo_url ? (
            <img src={property.cover_photo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{property.address || property.reference}</p>
            <p className="text-xs text-muted-foreground">{property.reference}</p>
            <p className="text-sm font-bold mt-0.5">
              {property.asking_price?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {daysInStage}d nesta etapa
          </Badge>
        </div>

        {/* Checklist for current stage */}
        <PropertyChecklist
          items={checklistItems}
          stage={property.current_stage}
          onToggle={onToggleChecklist}
        />
      </div>
    </div>
  );
}
