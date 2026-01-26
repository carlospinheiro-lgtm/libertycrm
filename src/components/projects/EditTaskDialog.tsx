import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useUpdateTask } from '@/hooks/useProjectTasks';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { 
  ProjectTask,
  ProjectTaskStatus, 
  ProjectTaskPriority,
  projectTaskStatusLabels,
  projectTaskPriorityLabels 
} from '@/types/projects';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ProjectTask | null;
  projectId: string;
}

export function EditTaskDialog({ open, onOpenChange, task, projectId }: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectTaskStatus>('backlog');
  const [priority, setPriority] = useState<ProjectTaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const updateTask = useUpdateTask();
  const { data: members } = useProjectMembers(projectId);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_user_id || '');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !task) return;

    updateTask.mutate({
      id: task.id,
      projectId,
      title,
      description: description || null,
      status,
      priority,
      assignee_user_id: assigneeId || null,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectTaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectTaskStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectTaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectTaskPriorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label>Responsável</Label>
              <Select 
                value={assigneeId || "_none"} 
                onValueChange={(v) => setAssigneeId(v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sem responsável</SelectItem>
                  {members?.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: pt }) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateTask.isPending || !title}>
              {updateTask.isPending ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
