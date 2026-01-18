import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, FolderKanban, Calendar, TrendingUp, TrendingDown, Archive, Pencil, ExternalLink } from 'lucide-react';
import { useProjects, useProjectStats, useArchiveProject } from '@/hooks/useProjects';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { 
  ProjectStatus, 
  projectStatusLabels, 
  projectStatusColors 
} from '@/types/projects';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }: { project: { id: string; name: string; status: string; pm_user?: { name: string } | null; end_date?: string | null; agency_id: string } }) {
  const { data: stats, isLoading: statsLoading } = useProjectStats(project.id);
  const archiveProject = useArchiveProject();
  const navigate = useNavigate();

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveProject.mutate(project.id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const status = project.status as ProjectStatus;

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projetos/${project.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn('text-xs', projectStatusColors[status])}>
                {projectStatusLabels[status]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/projetos/${project.id}`); }}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            {status !== 'archived' && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchive}>
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* PM */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {project.pm_user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{project.pm_user?.name || 'Sem PM'}</span>
        </div>

        {/* Progresso tarefas */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tarefas</span>
            {statsLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span>{stats?.completedTasks || 0}/{stats?.totalTasks || 0}</span>
            )}
          </div>
          {statsLoading ? (
            <Skeleton className="h-2 w-full" />
          ) : (
            <Progress value={stats?.taskProgress || 0} className="h-2" />
          )}
        </div>

        {/* Financeiro */}
        <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3">
          <div>
            <span className="text-muted-foreground block">Receitas</span>
            {statsLoading ? (
              <Skeleton className="h-4 w-full mt-1" />
            ) : (
              <span className="font-medium text-green-600">
                {formatCurrency(stats?.actualRevenue || 0)}
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground block">Custos</span>
            {statsLoading ? (
              <Skeleton className="h-4 w-full mt-1" />
            ) : (
              <span className={cn('font-medium', stats?.isOverBudget ? 'text-red-600' : 'text-foreground')}>
                {formatCurrency(stats?.actualCost || 0)}
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground block">Resultado</span>
            {statsLoading ? (
              <Skeleton className="h-4 w-full mt-1" />
            ) : (
              <span className={cn(
                'font-semibold flex items-center gap-1',
                (stats?.actualResult || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {(stats?.actualResult || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatCurrency(stats?.actualResult || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Data fim */}
        {project.end_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t">
            <Calendar className="h-3 w-3" />
            <span>Fim: {format(new Date(project.end_date), 'dd MMM yyyy', { locale: pt })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Projetos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { data: agencies } = useAgencies();
  const { user } = useAuth();
  
  // Por agora, usar a primeira agência do utilizador
  const selectedAgencyId = agencies?.[0]?.id;
  
  const { data: projects, isLoading } = useProjects(
    selectedAgencyId,
    statusFilter === 'all' ? undefined : statusFilter
  );

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
              <p className="text-sm text-muted-foreground">
                Gestão de projetos e controlo de custos
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="planning">Planeamento</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="at_risk">Em Risco</SelectItem>
              <SelectItem value="done">Concluído</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid de Projetos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Sem projetos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? 'Nenhum projeto encontrado com esses critérios.' : 'Comece por criar o seu primeiro projeto.'}
              </p>
              {!search && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Projeto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <AddProjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        agencyId={selectedAgencyId}
      />
    </DashboardLayout>
  );
}
