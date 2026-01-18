
-- =====================================================
-- MÓDULO PROJETOS - Project Hub
-- =====================================================

-- 1. Criar Enums
-- =====================================================

-- Status do projeto
CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'at_risk', 'done', 'archived');

-- Papel no projeto
CREATE TYPE public.project_member_role AS ENUM ('pm', 'member', 'finance', 'viewer');

-- Status da tarefa
CREATE TYPE public.project_task_status AS ENUM ('backlog', 'todo', 'doing', 'blocked', 'done');

-- Prioridade da tarefa
CREATE TYPE public.project_task_priority AS ENUM ('low', 'medium', 'high');

-- Tipo de item financeiro
CREATE TYPE public.financial_item_type AS ENUM ('cost', 'revenue');

-- Status do item financeiro
CREATE TYPE public.financial_item_status AS ENUM ('planned', 'submitted', 'approved', 'paid', 'received', 'archived');

-- 2. Criar Tabelas
-- =====================================================

-- A) projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status public.project_status NOT NULL DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    pm_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B) project_members
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.project_member_role NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- C) project_tasks
CREATE TABLE public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.project_task_status NOT NULL DEFAULT 'backlog',
    priority public.project_task_priority NOT NULL DEFAULT 'medium',
    assignee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D) project_financial_items
CREATE TABLE public.project_financial_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type public.financial_item_type NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    planned_value NUMERIC NOT NULL DEFAULT 0,
    actual_value NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    date_expected DATE,
    date_real DATE,
    status public.financial_item_status NOT NULL DEFAULT 'planned',
    vendor_or_client TEXT,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attachment_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E) project_activity_log
CREATE TABLE public.project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar Índices
-- =====================================================

CREATE INDEX idx_projects_agency_id ON public.projects(agency_id);
CREATE INDEX idx_projects_pm_user_id ON public.projects(pm_user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);

CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assignee ON public.project_tasks(assignee_user_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);

CREATE INDEX idx_project_financial_items_project_id ON public.project_financial_items(project_id);
CREATE INDEX idx_project_financial_items_type ON public.project_financial_items(type);
CREATE INDEX idx_project_financial_items_status ON public.project_financial_items(status);

CREATE INDEX idx_project_activity_log_project_id ON public.project_activity_log(project_id);

-- 4. Trigger para updated_at
-- =====================================================

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_financial_items_updated_at
    BEFORE UPDATE ON public.project_financial_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Funções Auxiliares para RLS
-- =====================================================

-- Verifica se utilizador é membro do projeto
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = _user_id
          AND project_id = _project_id
          AND is_active = true
    )
$$;

-- Obtém o papel do utilizador no projeto
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id UUID, _project_id UUID)
RETURNS public.project_member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND is_active = true
    LIMIT 1
$$;

-- Verifica se utilizador tem papel específico no projeto
CREATE OR REPLACE FUNCTION public.has_project_role(_user_id UUID, _project_id UUID, _role public.project_member_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = _user_id
          AND project_id = _project_id
          AND role = _role
          AND is_active = true
    )
$$;

-- Verifica se utilizador é PM ou Finance no projeto
CREATE OR REPLACE FUNCTION public.is_project_pm_or_finance(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = _user_id
          AND project_id = _project_id
          AND role IN ('pm', 'finance')
          AND is_active = true
    )
$$;

-- 6. Ativar RLS
-- =====================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_financial_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS - projects
-- =====================================================

-- Leitura: membros da agência podem ver projetos da sua agência
CREATE POLICY "Users can view projects in their agency"
ON public.projects FOR SELECT
TO authenticated
USING (
    public.has_agency_access(agency_id, auth.uid())
);

-- Criar: utilizadores autenticados podem criar projetos na sua agência
CREATE POLICY "Users can create projects in their agency"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
    public.has_agency_access(agency_id, auth.uid())
);

-- Atualizar: apenas PM do projeto pode atualizar
CREATE POLICY "PM can update their projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
    public.has_project_role(auth.uid(), id, 'pm')
    OR pm_user_id = auth.uid()
);

-- Eliminar: apenas PM do projeto
CREATE POLICY "PM can delete their projects"
ON public.projects FOR DELETE
TO authenticated
USING (
    public.has_project_role(auth.uid(), id, 'pm')
    OR pm_user_id = auth.uid()
);

-- 8. Políticas RLS - project_members
-- =====================================================

-- Leitura: membros do projeto podem ver outros membros
CREATE POLICY "Project members can view members"
ON public.project_members FOR SELECT
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
        AND public.has_agency_access(p.agency_id, auth.uid())
    )
);

-- Criar: apenas PM pode adicionar membros
CREATE POLICY "PM can add project members"
ON public.project_members FOR INSERT
TO authenticated
WITH CHECK (
    public.has_project_role(auth.uid(), project_id, 'pm')
    OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id
        AND p.pm_user_id = auth.uid()
    )
);

-- Atualizar: apenas PM pode modificar membros
CREATE POLICY "PM can update project members"
ON public.project_members FOR UPDATE
TO authenticated
USING (
    public.has_project_role(auth.uid(), project_id, 'pm')
);

-- Eliminar: apenas PM pode remover membros
CREATE POLICY "PM can remove project members"
ON public.project_members FOR DELETE
TO authenticated
USING (
    public.has_project_role(auth.uid(), project_id, 'pm')
);

-- 9. Políticas RLS - project_tasks
-- =====================================================

-- Leitura: membros do projeto podem ver tarefas
CREATE POLICY "Project members can view tasks"
ON public.project_tasks FOR SELECT
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
);

-- Criar: membros (exceto viewer) podem criar tarefas
CREATE POLICY "Active members can create tasks"
ON public.project_tasks FOR INSERT
TO authenticated
WITH CHECK (
    public.is_project_member(auth.uid(), project_id)
    AND public.get_project_role(auth.uid(), project_id) != 'viewer'
);

-- Atualizar: membros (exceto viewer) podem atualizar tarefas
CREATE POLICY "Active members can update tasks"
ON public.project_tasks FOR UPDATE
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
    AND public.get_project_role(auth.uid(), project_id) != 'viewer'
);

-- Eliminar: apenas PM pode eliminar tarefas
CREATE POLICY "PM can delete tasks"
ON public.project_tasks FOR DELETE
TO authenticated
USING (
    public.has_project_role(auth.uid(), project_id, 'pm')
);

-- 10. Políticas RLS - project_financial_items
-- =====================================================

-- Leitura: membros do projeto podem ver itens financeiros
CREATE POLICY "Project members can view financial items"
ON public.project_financial_items FOR SELECT
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
);

-- Criar: membros podem criar (status será 'submitted' se não for PM/finance)
CREATE POLICY "Members can create financial items"
ON public.project_financial_items FOR INSERT
TO authenticated
WITH CHECK (
    public.is_project_member(auth.uid(), project_id)
    AND public.get_project_role(auth.uid(), project_id) != 'viewer'
);

-- Atualizar: PM e Finance podem atualizar qualquer item, outros apenas os seus
CREATE POLICY "Members can update financial items"
ON public.project_financial_items FOR UPDATE
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
    AND (
        public.is_project_pm_or_finance(auth.uid(), project_id)
        OR created_by = auth.uid()
    )
);

-- Eliminar: apenas PM pode eliminar
CREATE POLICY "PM can delete financial items"
ON public.project_financial_items FOR DELETE
TO authenticated
USING (
    public.has_project_role(auth.uid(), project_id, 'pm')
);

-- 11. Políticas RLS - project_activity_log
-- =====================================================

-- Leitura: membros do projeto podem ver atividade
CREATE POLICY "Project members can view activity log"
ON public.project_activity_log FOR SELECT
TO authenticated
USING (
    public.is_project_member(auth.uid(), project_id)
);

-- Criar: sistema pode inserir (qualquer membro autenticado do projeto)
CREATE POLICY "Members can log activity"
ON public.project_activity_log FOR INSERT
TO authenticated
WITH CHECK (
    public.is_project_member(auth.uid(), project_id)
);

-- 12. Ativar Realtime
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_financial_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activity_log;
