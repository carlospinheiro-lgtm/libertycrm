

## Plano: Criar tabela `consultants`

### Migration SQL

Ficheiro: nova migration em `supabase/migrations/`

**Alterações vs SQL original do utilizador:**
- CHECK constraints substituídos por trigger de validação (requisito Lovable — CHECK constraints causam problemas na restauração)
- Adicionadas políticas RLS para acesso por agência (padrão consistente com as outras tabelas)
- Adicionado trigger `update_updated_at_column` para manter `updated_at` atualizado

### Estrutura da tabela

```text
consultants
├── id (uuid PK)
├── agency_id (uuid FK → agencies)
├── name (text NOT NULL)
├── nif (text)
├── entry_date (date)
├── tier (text) — validado por trigger: A, B, C
├── commission_system (text) — validado por trigger: Alternativo, Fixo
├── has_company (boolean, default false)
├── commission_pct (numeric)
├── team (text)
├── team_leader (text)
├── is_active (boolean, default true)
├── accumulated_12m (numeric, default 0)
├── created_at / updated_at (timestamptz)
```

### RLS Policies (mesmo padrão que `deals`)

- **SELECT**: `has_agency_access(auth.uid(), agency_id)`
- **INSERT**: `has_agency_access(auth.uid(), agency_id)`
- **UPDATE**: `has_agency_access(auth.uid(), agency_id)`
- **DELETE**: `has_agency_access(auth.uid(), agency_id)`

### Validation Trigger

Trigger `BEFORE INSERT OR UPDATE` que valida:
- `tier` IN ('A','B','C') ou NULL
- `commission_system` IN ('Alternativo','Fixo') ou NULL

### Tipos TypeScript

Regenerados automaticamente após a migration — sem edição manual.

### Ficheiros a alterar
- Nova migration SQL (único ficheiro)

