

## Problema

A tabela `leads` tem uma foreign key `leads_user_id_fkey` que aponta para `auth.users`, mas o codigo tenta fazer join com `public.profiles`. O PostgREST so reconhece relacoes baseadas em foreign keys existentes, por isso retorna erro 400.

A FK para `agencies` ja existe e esta correcta.

## Solucao

### 1. Migracao: adicionar FK de leads.user_id para profiles.id

Adicionar uma segunda foreign key no campo `user_id` apontando para `profiles(id)`:

```sql
ALTER TABLE public.leads
  ADD CONSTRAINT leads_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
```

### 2. Alterar a query no hook useLeads

Com duas FKs no mesmo campo (`auth.users` e `profiles`), o PostgREST exige desambiguacao. Alterar o `.select()` para usar o hint de FK:

```text
De:  .select('*, profiles(name), agencies(name)')
Para: .select('*, profiles!leads_user_id_profiles_fkey(name), agencies(name)')
```

### Ficheiros afetados

- Nova migracao SQL (1 ficheiro)
- `src/hooks/useLeads.ts` - alterar linha do `.select()` (1 linha)

### Resultado

Os 3 modulos CRM (Compradores, Vendedores, Recrutamento) passarao a mostrar os dados correctamente com o nome do agente e da agencia.

