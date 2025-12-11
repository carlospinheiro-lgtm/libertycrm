import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const columnColors: Record<string, string> = {
  blue: 'bg-kanban-new border-t-primary',
  cyan: 'bg-kanban-progress border-t-info',
  yellow: 'bg-kanban-review border-t-warning',
  green: 'bg-kanban-done border-t-success',
  red: 'bg-kanban-lost border-t-destructive',
  gray: 'bg-muted border-t-muted-foreground',
};

export function KanbanColumn({ title, color, count, children }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-72">
      <div
        className={cn(
          'rounded-lg border-t-4 p-4 min-h-[500px]',
          columnColors[color] || columnColors.gray
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="bg-card text-foreground text-xs font-medium px-2 py-1 rounded-full">
            {count}
          </span>
        </div>

        {/* Cards */}
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
