

## Plano: Coluna Consultor editável com dropdown na página Processos

### Problema
A coluna "Consultor" mostra texto estático. Precisa de ser um dropdown editável com pesquisa, que atualiza `consultant_name` e recalcula `consultant_commission`.

### Alterações em `src/pages/Processos.tsx`

**1. Novo componente inline `ConsultantCell`**

Componente que renderiza dentro da `TableCell` do consultor (linha 304). Comportamento:
- Estado normal: mostra nome + ícone `ChevronDown` discreto no hover
- Ao clicar: abre `Popover` com `Input` de pesquisa + lista de consultores filtrada por nome/NIF
- Busca consultores da agência via query (`consultants` table, `name`, `nif`, `commission_pct`, filtrado por `agency_id` e `is_active = true`)
- Ao selecionar: chama `useUpdateDeal` com `consultant_name` e `consultant_commission` recalculada
- Fórmula: `consultant_commission = commission_store * (consultant.commission_pct / 100)`, fallback `commission_pct = 47` se null
- Mostra `Loader2` spinner enquanto guarda, toast de confirmação

**2. Imports adicionais**
- `Popover, PopoverTrigger, PopoverContent` de `@/components/ui/popover`
- `Loader2, ChevronDown` de `lucide-react`
- `useUpdateDeal` de `@/hooks/useDeals`
- `useAuth` de `@/contexts/AuthContext`
- `supabase` de `@/integrations/supabase/client`
- `useQuery` de `@tanstack/react-query`

**3. Substituir linha 304**
```
<TableCell className="text-sm">{deal.consultant_name || '—'}</TableCell>
```
por:
```
<TableCell className="text-sm p-0">
  <ConsultantCell deal={deal} />
</TableCell>
```

**4. Lógica do `ConsultantCell`**
- Query local para consultores da agência (cached, `staleTime: 5min`)
- Filtra lista por texto digitado (match em `name` ou `nif`)
- Ao selecionar, fecha popover, mostra spinner, faz update, toast

### Ficheiro
- `src/pages/Processos.tsx` — ~80 linhas adicionadas

