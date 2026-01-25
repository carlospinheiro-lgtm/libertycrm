
## Diagnóstico (o que se passa)

O problema de “não consigo criar projetos / clico em criar e não acontece nada” está a acontecer porque a política de segurança do backend (RLS) na tabela **`projects`** está a chamar a função **`has_agency_access`** com os parâmetros trocados.

- A função está definida como:  
  `has_agency_access(_user_id uuid, _agency_id uuid)`
- Mas a política (criada numa migração) está a chamar assim:  
  `has_agency_access(agency_id, auth.uid())`

Isto faz com que a verificação de acesso falhe sempre e o backend bloqueia o INSERT com o erro típico:  
**“new row violates row-level security policy for table "projects"”**

Além disso, a função `has_agency_access` deve também considerar acesso via **roles** (`user_roles`) e não apenas por vínculo em `user_agencies`, para evitar que quem tem role na agência fique bloqueado.

---

## Objectivo

1) Corrigir a ordem dos parâmetros nas políticas RLS que usam `has_agency_access`.  
2) Reforçar `has_agency_access` para também validar acesso via `user_roles`.  
3) Garantir que a criação de projetos volta a funcionar imediatamente (sem “cliques que não fazem nada”).

---

## Implementação (backend)

### A) Corrigir a função `has_agency_access`

Actualizar a função para devolver `true` se:
- for admin global, OU
- tiver vínculo activo em `user_agencies`, OU
- tiver qualquer role em `user_roles` para essa agência

SQL (a aplicar numa alteração ao backend):

```sql
CREATE OR REPLACE FUNCTION public.has_agency_access(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_global_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_agencies
      WHERE user_id = _user_id
        AND agency_id = _agency_id
        AND is_active = true
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND agency_id = _agency_id
    );
$$;
```

> Nota: Não vamos guardar roles em `profiles` nem em “client-side”; fica tudo na tabela `user_roles` (seguro).

---

### B) Corrigir as políticas da tabela `projects`

Precisamos de garantir que passam a usar a assinatura certa:

- `USING ( has_agency_access(auth.uid(), agency_id) )`
- `WITH CHECK ( has_agency_access(auth.uid(), agency_id) )`

SQL:

```sql
DROP POLICY IF EXISTS "Users can view projects in their agency" ON public.projects;
CREATE POLICY "Users can view projects in their agency"
ON public.projects
FOR SELECT
TO authenticated
USING ( public.has_agency_access(auth.uid(), agency_id) );

DROP POLICY IF EXISTS "Users can create projects in their agency" ON public.projects;
CREATE POLICY "Users can create projects in their agency"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK ( public.has_agency_access(auth.uid(), agency_id) );
```

---

### C) Corrigir a política de leitura da tabela `project_members` (importante para o ecrã de membros)

Há uma política em `project_members` que também tem a chamada com ordem errada:

Onde está hoje (errado):
- `has_agency_access(p.agency_id, auth.uid())`

Deve ficar (certo):
- `has_agency_access(auth.uid(), p.agency_id)`

SQL:

```sql
DROP POLICY IF EXISTS "Project members can view members" ON public.project_members;
CREATE POLICY "Project members can view members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  public.is_project_member(auth.uid(), project_id)
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_id
      AND public.has_agency_access(auth.uid(), p.agency_id)
  )
);
```

---

## Verificação (passos de teste)

1) Fazer login normalmente.
2) Ir a **/projetos**.
3) Clicar **Adicionar Projeto** → preencher nome → **Criar**.
4) Confirmar:
   - o projeto aparece na lista
   - não surge erro de RLS
5) Ir ao detalhe do projeto → abrir **Membros** e validar que:
   - a lista carrega
   - o PM consegue adicionar/remover/alterar papéis conforme as regras

---

## Riscos / Notas

- Esta correção é “cirúrgica”: não muda tabelas nem dados; apenas ajusta função e políticas.
- Se existirem outras políticas noutros módulos com `has_agency_access(agency_id, auth.uid())`, devemos procurar e corrigir da mesma forma (na prática, é uma pesquisa simples e repetimos o padrão).

---

## Resultado esperado

Depois destas alterações:
- Criar projetos em **/projetos** deixa de falhar silenciosamente.
- Utilizadores com **role na agência** passam a conseguir criar/ver projetos mesmo sem registo em `user_agencies`.
- A gestão de membros funciona de forma consistente com as permissões do projeto e da agência.
