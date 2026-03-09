

## Plano: Corrigir Comissão Consultor e adicionar campo % Honorário Consultor

### Problema
A `consultant_commission` nos deals está a null/0 porque nunca é preenchida na criação. A página Pagamentos usa esse valor diretamente, logo mostra 0€.

### Alterações

**1. `src/pages/Pagamentos.tsx`** — Fallback no cálculo

Na agregação por consultor, quando `consultant_commission` é 0 ou null, usar fallback: `commission_store × 0.47`.

```typescript
const getCommission = (d: Deal) => {
  if (d.consultant_commission) return d.consultant_commission;
  return (d.commission_store || 0) * 0.47;
};
```

Aplicar este helper no `reduce` do `grossCommission` e no extrato individual.

**2. `src/components/processos/AddDealSheet.tsx`** — Novo campo "% Honorário Consultor"

- Adicionar estado `consultantPct` (string)
- Calcular `consultantCommission = commissionStore × (consultantPct / 100)`
- Mostrar na secção opcional, com o valor calculado em € ao lado (read-only)
- Incluir `consultant_commission` no payload do save

**3. `src/components/processos/DealDetailsSheet.tsx`** — Tab Financeiro

O campo `consultant_commission` já é editável (linha 196). Sem alteração necessária neste ficheiro.

### Ficheiros a alterar
- `src/pages/Pagamentos.tsx`
- `src/components/processos/AddDealSheet.tsx`

