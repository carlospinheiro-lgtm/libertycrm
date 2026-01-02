-- Fase 1: Criar tabela import_jobs completa

CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('users', 'teams')),
  file_name text NOT NULL,
  file_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by_user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  summary_json jsonb,
  diff_json jsonb,
  notes text
);

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver jobs da sua agência"
  ON public.import_jobs FOR SELECT
  USING (
    is_global_admin(auth.uid()) 
    OR has_role_in_agency(auth.uid(), 'diretor_agencia'::app_role, agency_id)
    OR has_role_in_agency(auth.uid(), 'diretor_rh'::app_role, agency_id)
  );

CREATE POLICY "Admins podem criar jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (
    is_global_admin(auth.uid()) 
    OR has_role_in_agency(auth.uid(), 'diretor_agencia'::app_role, agency_id)
    OR has_role_in_agency(auth.uid(), 'diretor_rh'::app_role, agency_id)
  );

CREATE POLICY "Admins podem atualizar jobs"
  ON public.import_jobs FOR UPDATE
  USING (
    is_global_admin(auth.uid()) 
    OR has_role_in_agency(auth.uid(), 'diretor_agencia'::app_role, agency_id)
  );

-- Índices para performance
CREATE INDEX idx_import_jobs_agency_id ON public.import_jobs(agency_id);
CREATE INDEX idx_import_jobs_created_at ON public.import_jobs(created_at DESC);
CREATE INDEX idx_user_agencies_agency_external ON public.user_agencies(agency_id, external_id);
CREATE INDEX idx_teams_agency_external ON public.teams(agency_id, external_id);