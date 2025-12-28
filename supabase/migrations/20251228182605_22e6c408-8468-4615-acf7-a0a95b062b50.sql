-- =====================================================
-- SISTEMA MULTI-AGÊNCIA - LIBERTY BUSINESS HUB
-- =====================================================

-- 1. ENUM para roles da aplicação
create type public.app_role as enum (
  'diretor_geral',
  'diretor_comercial',
  'diretor_agencia',
  'team_leader',
  'agente_imobiliario',
  'diretor_rh',
  'diretor_financeiro',
  'gestor_backoffice',
  'assistente_administrativo',
  'consultor_externo'
);

-- 2. ENUM para tipos de importação
create type public.import_type as enum ('users', 'teams');

-- =====================================================
-- TABELA: agencies (Agências RE/MAX)
-- =====================================================
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  remax_code text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: profiles (Utilizadores base)
-- =====================================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text not null,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- TABELA: teams (Equipas por agência)
-- =====================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade not null,
  external_id text,
  name text not null,
  leader_user_id uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  is_synced boolean default false,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(agency_id, external_id)
);

-- =====================================================
-- TABELA: user_roles (Roles separados por segurança)
-- =====================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique(user_id, agency_id, role)
);

-- =====================================================
-- TABELA: user_agencies (Relação multi-agência)
-- =====================================================
create table public.user_agencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  external_id text,
  team_id uuid references public.teams(id) on delete set null,
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  is_active boolean default true,
  is_synced boolean default false,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, agency_id),
  unique(agency_id, external_id)
);

-- =====================================================
-- TABELA: import_logs (Histórico de importações)
-- =====================================================
create table public.import_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade not null,
  import_type import_type not null,
  file_name text,
  created_count integer default 0,
  updated_count integer default 0,
  deactivated_count integer default 0,
  imported_by uuid references public.profiles(id) on delete set null,
  imported_at timestamptz default now(),
  notes text
);

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers para updated_at
create trigger update_agencies_updated_at
  before update on public.agencies
  for each row execute function public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_teams_updated_at
  before update on public.teams
  for each row execute function public.update_updated_at_column();

create trigger update_user_agencies_updated_at
  before update on public.user_agencies
  for each row execute function public.update_updated_at_column();

-- =====================================================
-- FUNÇÃO: Criar perfil automaticamente ao registar
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================
-- FUNÇÃO: Verificar role do utilizador (Security Definer)
-- =====================================================
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- =====================================================
-- FUNÇÃO: Verificar role numa agência específica
-- =====================================================
create or replace function public.has_role_in_agency(_user_id uuid, _role app_role, _agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
      and agency_id = _agency_id
  )
$$;

-- =====================================================
-- FUNÇÃO: Verificar se é admin global (Diretor Geral)
-- =====================================================
create or replace function public.is_global_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = 'diretor_geral'
  )
$$;

-- =====================================================
-- FUNÇÃO: Obter agências do utilizador
-- =====================================================
create or replace function public.get_user_agency_ids(_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id
  from public.user_agencies
  where user_id = _user_id
    and is_active = true
$$;

-- =====================================================
-- FUNÇÃO: Verificar acesso à agência
-- =====================================================
create or replace function public.has_agency_access(_user_id uuid, _agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_agencies
    where user_id = _user_id
      and agency_id = _agency_id
      and is_active = true
  ) or public.is_global_admin(_user_id)
$$;

-- =====================================================
-- HABILITAR RLS
-- =====================================================
alter table public.agencies enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_agencies enable row level security;
alter table public.import_logs enable row level security;

-- =====================================================
-- RLS POLICIES: agencies
-- =====================================================
create policy "Agências visíveis para utilizadores autenticados"
  on public.agencies for select
  to authenticated
  using (
    is_active = true
    or public.is_global_admin(auth.uid())
  );

create policy "Apenas admins globais podem criar agências"
  on public.agencies for insert
  to authenticated
  with check (public.is_global_admin(auth.uid()));

create policy "Apenas admins globais podem atualizar agências"
  on public.agencies for update
  to authenticated
  using (public.is_global_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES: profiles
-- =====================================================
create policy "Perfis visíveis para utilizadores autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Utilizadores podem atualizar o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Perfis criados automaticamente via trigger"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- =====================================================
-- RLS POLICIES: teams
-- =====================================================
create policy "Equipas visíveis para membros da agência"
  on public.teams for select
  to authenticated
  using (
    public.has_agency_access(auth.uid(), agency_id)
  );

create policy "Diretores podem criar equipas na sua agência"
  on public.teams for insert
  to authenticated
  with check (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_comercial', agency_id)
  );

create policy "Diretores podem atualizar equipas na sua agência"
  on public.teams for update
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_comercial', agency_id)
  );

create policy "Diretores podem eliminar equipas na sua agência"
  on public.teams for delete
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
  );

-- =====================================================
-- RLS POLICIES: user_roles
-- =====================================================
create policy "Roles visíveis para admins e próprio utilizador"
  on public.user_roles for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

create policy "Apenas admins podem atribuir roles"
  on public.user_roles for insert
  to authenticated
  with check (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

create policy "Apenas admins podem atualizar roles"
  on public.user_roles for update
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
  );

create policy "Apenas admins podem remover roles"
  on public.user_roles for delete
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
  );

-- =====================================================
-- RLS POLICIES: user_agencies
-- =====================================================
create policy "Vínculos visíveis para membros da agência e admins"
  on public.user_agencies for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_global_admin(auth.uid())
    or public.has_agency_access(auth.uid(), agency_id)
  );

create policy "Admins podem criar vínculos de agência"
  on public.user_agencies for insert
  to authenticated
  with check (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

create policy "Admins podem atualizar vínculos de agência"
  on public.user_agencies for update
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

create policy "Admins podem remover vínculos de agência"
  on public.user_agencies for delete
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
  );

-- =====================================================
-- RLS POLICIES: import_logs
-- =====================================================
create policy "Logs visíveis para admins da agência"
  on public.import_logs for select
  to authenticated
  using (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

create policy "Admins podem criar logs de importação"
  on public.import_logs for insert
  to authenticated
  with check (
    public.is_global_admin(auth.uid())
    or public.has_role_in_agency(auth.uid(), 'diretor_agencia', agency_id)
    or public.has_role_in_agency(auth.uid(), 'diretor_rh', agency_id)
  );

-- =====================================================
-- ÍNDICES para performance
-- =====================================================
create index idx_teams_agency_id on public.teams(agency_id);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_roles_agency_id on public.user_roles(agency_id);
create index idx_user_agencies_user_id on public.user_agencies(user_id);
create index idx_user_agencies_agency_id on public.user_agencies(agency_id);
create index idx_import_logs_agency_id on public.import_logs(agency_id);