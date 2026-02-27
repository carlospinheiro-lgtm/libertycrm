import { DbPropertyActivity } from '@/hooks/usePropertyActivities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Activity, FileText, Eye, RefreshCw, CheckCircle, MessageSquare } from 'lucide-react';

interface PropertyHistoryTabProps {
  activities: DbPropertyActivity[];
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  stage_change: RefreshCw,
  checklist: CheckCircle,
  visit: Eye,
  document: FileText,
  note: MessageSquare,
};

export function PropertyHistoryTab({ activities }: PropertyHistoryTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Histórico & Notas</h3>

      {activities.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          Sem atividade registada
        </Card>
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const Icon = ACTIVITY_ICONS[a.activity_type] || Activity;
            return (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-xs">{a.user_name}</p>
                    <Badge variant="outline" className="text-[10px]">{a.activity_type}</Badge>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(a.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
