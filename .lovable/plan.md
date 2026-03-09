

## Plano: Ajustar formulário "Novo Processo"

O `AddDealSheet.tsx` já existe e está quase correto. Precisa de 3 ajustes para corresponder à spec:

### Alterações em `src/components/processos/AddDealSheet.tsx`

1. **Remover campos `cpcv_pct` e `deed_pct`** — não estão na lista de campos opcionais pedidos. Remover estado, inputs e referências no `handleSave`.

2. **Corrigir cálculo da comissão** — mudar de `sale_value × commission_pct / 100` para `sale_value × commission_pct` (sem dividir por 100, conforme spec).

3. **Label e read-only** — mudar label de "Comissão Loja (€)" para "Comissão Loja (calculada)" e tornar o campo verdadeiramente `readOnly` (em vez de editável manualmente). Remover lógica `commissionManual`.

### Integração na página (`src/pages/Processos.tsx`)

Já está ligado — `newDealOpen` controla a abertura, botão "+ Novo Processo" e botão "Adicionar primeiro processo" já abrem a Sheet. Sem alterações necessárias.

