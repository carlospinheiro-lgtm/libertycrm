

## Plano: Arquitetura SaaS Multi-Tenant

### 1. Migration — tabela `organizations` + alterações

Uma migration SQL que:
- Cria tabela `organizations` com os campos pedidos (sem CHECK constraint — usar validation trigger para `plan`)
- Adiciona `organization_id` à tabela `agencies`
- Adiciona `is_super_admin` à tabela `profiles`
- Ativa RLS em `organizations` com policy SELECT usando `has_agency_access` e `is_super_admin`
- Policies INSERT/UPDATE/DELETE apenas para super admins
- Cria função `is_super_admin(_user_id uuid)` como SECURITY DEFINER para evitar recursão RLS

Uma segunda operação (insert tool) para:
- Inserir a organização "Liberty" com plano enterprise
- Atualizar todas as agências existentes com o `organization_id` retornado

### 2. `src/types/rbac.ts` — expandir `RBACUser`

Adicionar campos opcionais:
```typescript
isSuperAdmin?: boolean;
organizationId?: string;
```

### 3. `src/contexts/AuthContext.tsx`

- No `fetchUserData`, adicionar query de `is_super_admin` do profile e `organization_id` via agencies
- Expor `isSuperAdmin` no `AuthContextType`
- No `currentUser` memo, incluir `isSuperAdmin` e `organizationId`
- Adicionar `isSuperAdmin` ao context value

### 4. `src/pages/SuperAdmin.tsx` — nova página

Página protegida por `isSuperAdmin`:
- Se não é super admin, `<Navigate to="/" />`
- Tabela de organizations com colunas: Nome, Slug, Plano, Agências (count), Utilizadores (count), Estado, Data criação
- Botão "+ Nova Organização" com dialog (nome, slug auto-gerado, email, plano, limites)
- Toggle Suspender/Ativar por linha
- Badges por plano: starter=cinza, pro=azul, enterprise=dourado
- Queries diretas via supabase client

### 5. `src/App.tsx` — nova rota

Adicionar rota `/superadmin` com `<ProtectedRoute>` apontando para `SuperAdmin`.

### Ficheiros editados
- Migration SQL (nova tabela + alterações)
- `src/types/rbac.ts` — 2 campos em RBACUser
- `src/contexts/AuthContext.tsx` — isSuperAdmin + organizationId
- `src/pages/SuperAdmin.tsx` — novo
- `src/App.tsx` — rota

### Segurança
- Função `is_super_admin` SECURITY DEFINER evita recursão RLS em profiles
- RLS em organizations: SELECT para membros via agencies, full CRUD para super admins
- Nenhuma alteração a queries existentes — `organization_id` é nullable em agencies

