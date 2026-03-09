

## Plano: Corrigir formulário "Novo Processo"

### Problema 1 — Fórmula da comissão errada

Linha 42: `parseFloat(saleValue) * parseFloat(commissionPct)` — falta dividir por 100.

**Correção**: Mudar para `parseFloat(saleValue) * (parseFloat(commissionPct) / 100)`.

O `useMemo` com dependências `[saleValue, commissionPct]` já reage ao onChange — o cálculo em tempo real funciona, apenas o resultado estava errado.

### Problema 2 — Validação e Select

Após revisão, a validação e os valores do Select estão corretos:
- Validação no `handleSave` verifica todos os 6 campos obrigatórios
- Select usa valores exactos: `Venda`, `AngariaçãoVenda`, `AngariaArrenda`, `Arrenda`

Sem alterações necessárias aqui.

### Ficheiro a alterar

`src/components/processos/AddDealSheet.tsx` — linha 42: corrigir fórmula.

