import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ColumnHeader } from './ColumnHeader';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
  onEditTitle: (newTitle: string) => void;
  onDelete: () => void;
  canDelete?: boolean;
}

const columnColors: Record<string, string> = {
  blue: 'bg-kanban-new border-t-primary',
  cyan: 'bg-kanban-progress border-t-info',
  yellow: 'bg-kanban-review border-t-warning',
  green: 'bg-kanban-done border-t-success',
  red: 'bg-kanban-lost border-t-destructive',
  gray: 'bg-muted border-t-muted-foreground',
};

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
  onEditTitle,
  onDelete,
  canDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72">
      <div
        ref={setNodeRef}
        className={cn(
          'rounded-lg border-t-4 p-4 min-h-[500px] transition-all duration-200',
          columnColors[color] || columnColors.gray,
          isOver && 'kanban-column-over'
        )}
      >
        {/* Header */}
        <ColumnHeader
          title={title}
          count={count}
          onEdit={onEditTitle}
          onDelete={onDelete}
          canDelete={canDelete}
        />

        {/* Cards */}
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
