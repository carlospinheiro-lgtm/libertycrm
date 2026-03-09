

## Plano: Sistema de Descontos Manuais e Página de Pagamentos

### 1. Auto-cálculo no tab Financeiro (`DealDetailsSheet.tsx`)

Quando `discount_pct` muda, calcular automaticamente:
`expense_discount = consultant_commission × (discount_pct / 100)`

- Adicionar campo `consultant_commission` ao estado `fin` (read-only, vindo do deal)
- No handler de `discount_pct`, recalcular `expense_discount` automaticamente
- Campo `expense_discount` continua editável (override manual possível)

### 2. Nova página Pagamentos (`src/pages/Pagamentos.tsx`)

**Filtros no topo:**
- Seletor de mês (reported_month dos deals)

**Tabela de consultores** (agrupada por `consultant_name`):
| Consultor | Nº Processos | Comissão Bruta | Desconto Despesas | Comissão Líquida |
|-----------|-------------|----------------|-------------------|------------------|
Onde:
- Comissão Bruta = `sum(consultant_commission)` dos deals do mês
- Desconto Despesas = `sum(expense_discount)` dos deals do mês
- Comissão Líquida = Comissão Bruta - Desconto Despesas

**Botão "Ver Extrato"** → abre Sheet com detalhe por processo:
| PV | Tipo | Valor Venda | Comissão Consultor | Desconto Despesas | Líquido |
Se `discount_pct = 0` ou null → coluna desconto mostra "—"

### 3. Rota e Sidebar

- Adicionar rota `/pagamentos` em `App.tsx`
- Substituir a rota `/contas` (Contas Correntes / ComingSoon) pela nova página Pagamentos
- Atualizar label no Sidebar: "Contas Correntes" → "Pagamentos"

### Ficheiros a criar
- `src/pages/Pagamentos.tsx` — página completa com tabela de consultores e sheet de extrato

### Ficheiros a alterar
- `src/components/processos/DealDetailsSheet.tsx` — auto-cálculo expense_discount
- `src/App.tsx` — rota `/pagamentos`
- `src/components/layout/Sidebar.tsx` — label do menu

### Sem alterações de base de dados
Todos os campos necessários (`discount_pct`, `expense_discount`, `consultant_commission`, `consultant_name`, `reported_month`) já existem na tabela `deals`.

