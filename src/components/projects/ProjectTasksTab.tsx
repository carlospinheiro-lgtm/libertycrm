import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar, GripVertical, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { useProjectTasks, useMoveTask, useDeleteTask } from '@/hooks/useProjectTasks';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { 
  ProjectTask, 
  ProjectTaskStatus, 
  projectTaskStatusLabels, 
  projectTaskStatusColors,
  projectTaskPriorityLabels,
  projectTaskPriorityColors,
} from '@/types/projects';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TASK_COLUMNS: ProjectTaskStatus[] = ['backlog', 'todo', 'doing', 'blocked', 'done'];

interface TaskCardProps {
  task: ProjectTask;
  canEdit: boolean;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, canEdit, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group',
        isDragging && 'opacity-50',
        isOverdue && 'border-red-300'
      )}
    >
      <div className="flex items-start gap-2">
        {canEdit && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-tight">{task.title}</p>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={cn('text-[10px]', projectTaskPriorityColors[task.priority])}>
              {projectTaskPriorityLabels[task.priority]}
            </Badge>
            
            {task.due_date && (
              <div className={cn(
                'flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-600' : 'text-muted-foreground'
              )}>
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.due_date), 'dd/MM', { locale: pt })}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            {task.assignee ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px]">
                    {task.assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">Sem responsável</span>
            )}
            
            {canEdit && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProjectTasksTabProps {
  projectId: string;
  canEdit: boolean;
}

export function ProjectTasksTab({ projectId, canEdit }: ProjectTasksTabProps) {
  const { data: tasks, isLoading } = useProjectTasks(projectId);
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addToColumn, setAddToColumn] = useState<ProjectTaskStatus>('backlog');
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByColumn = useMemo(() => {
    const result: Record<ProjectTaskStatus, ProjectTask[]> = {
      backlog: [],
      todo: [],
      doing: [],
      blocked: [],
      done: [],
    };

    tasks?.forEach(task => {
      if (result[task.status]) {
        result[task.status].push(task);
      }
    });

    return result;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    // Determinar a coluna de destino
    let newStatus: ProjectTaskStatus;
    const overId = over.id as string;
    
    if (TASK_COLUMNS.includes(overId as ProjectTaskStatus)) {
      newStatus = overId as ProjectTaskStatus;
    } else {
      const overTask = tasks?.find(t => t.id === overId);
      newStatus = overTask?.status || task.status;
    }

    if (newStatus !== task.status) {
      const tasksInNewColumn = tasksByColumn[newStatus];
      const newOrderIndex = tasksInNewColumn.length;

      moveTask.mutate({
        taskId,
        projectId,
        newStatus,
        newOrderIndex,
      });
    }
  };

  const handleAddTask = (column: ProjectTaskStatus) => {
    setAddToColumn(column);
    setAddDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Tem a certeza que deseja eliminar esta tarefa?')) {
      deleteTask.mutate({ id: taskId, projectId });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TASK_COLUMNS.map(col => (
          <Card key={col}>
            <CardHeader className="py-3">
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {TASK_COLUMNS.map(column => (
            <Card key={column} className="min-w-[250px]">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', projectTaskStatusColors[column].replace('text-', 'bg-').split(' ')[0])} />
                    {projectTaskStatusLabels[column]}
                    <Badge variant="secondary" className="text-xs">
                      {tasksByColumn[column].length}
                    </Badge>
                  </CardTitle>
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddTask(column)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <SortableContext
                  items={tasksByColumn[column].map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                  id={column}
                >
                  <div className="space-y-2 min-h-[100px]" data-column={column}>
                    {tasksByColumn[column].map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        canEdit={canEdit}
                        onEdit={setEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                    {tasksByColumn[column].length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        Arraste tarefas aqui
                      </div>
                    )}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
              <p className="font-medium text-sm">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AddTaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        projectId={projectId}
        defaultStatus={addToColumn}
      />

      <EditTaskDialog
        open={!!editTask}
        onOpenChange={(open) => !open && setEditTask(null)}
        task={editTask}
        projectId={projectId}
      />
    </>
  );
}
