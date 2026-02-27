import { ChecklistItem } from '@/hooks/usePropertyChecklist';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface PropertyChecklistProps {
  items: ChecklistItem[];
  stage: string;
  onToggle: (id: string, completed: boolean) => void;
}

const STAGE_LABELS: Record<string, string> = {
  documentos: 'Recolha de Documentos',
  avaliacao: 'Avaliação',
  publicacao: 'Publicação',
  visitas: 'Visitas',
  negociacao: 'Negociação',
};

export function PropertyChecklist({ items, stage, onToggle }: PropertyChecklistProps) {
  const stageItems = items.filter(i => i.stage === stage);
  const required = stageItems.filter(i => !i.is_optional);
  const completed = required.filter(i => i.is_completed);
  const pct = required.length > 0 ? Math.round((completed.length / required.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{STAGE_LABELS[stage] || stage}</h4>
        <span className="text-xs text-muted-foreground">
          {completed.length}/{required.length} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <ul className="space-y-1.5">
        {stageItems.map(item => (
          <li key={item.id} className="flex items-start gap-2">
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={checked => onToggle(item.id, !!checked)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.label}
                {item.is_optional && <span className="text-muted-foreground text-xs ml-1">(opcional)</span>}
              </span>
              {item.completed_at && (
                <p className="text-[10px] text-muted-foreground">
                  Concluído {format(new Date(item.completed_at), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          </li>
        ))}
        {stageItems.length === 0 && (
          <li className="text-xs text-muted-foreground italic">Sem itens de checklist</li>
        )}
      </ul>
    </div>
  );
}
