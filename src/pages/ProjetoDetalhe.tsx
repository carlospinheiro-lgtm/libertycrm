import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Settings, Users, Clock } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useCurrentUserProjectRole } from '@/hooks/useProjectMembers';
import { ProjectTasksTab } from '@/components/projects/ProjectTasksTab';
import { ProjectBudgetTab } from '@/components/projects/ProjectBudgetTab';
import { ProjectReportTab } from '@/components/projects/ProjectReportTab';
import { projectStatusLabels, projectStatusColors, ProjectStatus } from '@/types/projects';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tarefas');
  
  const { data: project, isLoading } = useProject(id);
  const { data: userRole } = useCurrentUserProjectRole(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Projeto não encontrado</h2>
          <p className="text-muted-foreground mb-4">O projeto que procura não existe ou não tem acesso.</p>
          <Button onClick={() => navigate('/projetos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Projetos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = project.status as ProjectStatus;
  const canEdit = userRole === 'pm' || userRole === 'member';
  const canManageFinance = userRole === 'pm' || userRole === 'finance';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit"
            onClick={() => navigate('/projetos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                  <Badge className={cn('text-xs', projectStatusColors[status])}>
                    {projectStatusLabels[status]}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {project.pm_user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{project.pm_user?.name || 'Sem PM'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Atualizado {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {userRole === 'pm' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Membros
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          </TabsList>

          <TabsContent value="tarefas" className="mt-6">
            <ProjectTasksTab 
              projectId={project.id} 
              canEdit={canEdit} 
            />
          </TabsContent>

          <TabsContent value="orcamento" className="mt-6">
            <ProjectBudgetTab 
              projectId={project.id} 
              canEdit={canEdit}
              canManageFinance={canManageFinance}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="relatorio" className="mt-6">
            <ProjectReportTab 
              projectId={project.id}
              projectName={project.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
