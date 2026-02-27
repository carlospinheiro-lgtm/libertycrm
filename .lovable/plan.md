

## Problema Identificado

As leads de compradores, vendedores e recrutamento **existem na base de dados** (foram inseridas com sucesso), mas **nao aparecem no ecra** porque o pedido ao servidor retorna erro 400:

> "Could not find a relationship between 'leads' and 'profiles' in the schema cache"

A tabela `leads` tem um campo `user_id` mas nao existe uma foreign key definida para a tabela `profiles`. O mesmo acontece com `agency_id` para `agencies`. Sem essas FK, o PostgREST nao consegue fazer o join automatico.

## Solucao

### 1. Criar migracao com as foreign keys em falta

Adicionar duas foreign keys na tabela `leads`:
- `leads.user_id` -> `profiles.id`
- `leads.agency_id` -> `agencies.id`

### 2. Sem alteracoes de codigo necessarias

O hook `useLeads` ja faz `.select('*, profiles(name), agencies(name)')` corretamente. Basta adicionar as FK para que o PostgREST reconheca a relacao e o join funcione.

## Detalhes Tecnicos

```sql
ALTER TABLE public.leads
  ADD CONSTRAINT leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.leads
  ADD CONSTRAINT leads_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id);
```

Apos esta migracao, os 3 modulos CRM (Compradores, Vendedores, Recrutamento) passarao a mostrar os dados correctamente.

