

## Plano: Corrigir importação silenciosa de processos

### Problema identificado

A importação de processos não tem **tratamento de erros** nos `insert` e `update` do Supabase (linha 358). Se o insert falhar (e.g. RLS, tipo de dados, etc.), o erro é silenciosamente ignorado e o toast mostra sucesso. Atualmente existem **0 registos importados** na BD — apenas 1 deal que foi criado manualmente.

### Correções

**Ficheiro: `src/pages/Importacao.tsx`**

1. **Adicionar error handling nos inserts/updates** — capturar `error` do Supabase e:
   - Fazer `console.error` com o detalhe do erro
   - Contar falhas vs sucessos
   - Mostrar toast com contagem real de inserções bem-sucedidas vs falhadas

2. **Usar `as any` no insert** para evitar conflitos de tipos TypeScript que possam causar problemas de compilação (padrão já usado no `useDeals.ts`).

3. **Adicionar `.select()` ao insert** para confirmar que o registo foi criado.

4. **Toast final com resultado real**: "✅ X processos importados (Y registos criados, Z falhados)"

**Ficheiro: `src/hooks/useDeals.ts`** — sem alterações necessárias, a query já filtra por `agency_id`.

### Resumo de alterações
- `src/pages/Importacao.tsx` — adicionar error handling e logging nos inserts da tab Processos (e Consultores/Equipas por consistência)

