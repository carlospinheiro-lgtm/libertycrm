

## Plano: Corrigir 3 problemas no CRM Processual

### 1. KPI "Faturação total" sempre a 0€

**Problema**: Linha 94 soma apenas `invoice_value`, que pode estar vazio para deals com status >= 1.

**Correção** em `src/pages/Processos.tsx` linha 94:
- Filtrar deals com `deal_status >= 1`
- Usar `invoice_value ?? commission_store ?? 0` como fallback

### 2. Botões editar e apagar na tabela

**Alterações em `src/pages/Processos.tsx`**:
- Adicionar state `editDeal` para controlar edição
- Adicionar state `deleteDeal` para controlar confirmação de apagar
- Na coluna Ações (linha 295-299): adicionar ícone lápis (abre AddDealSheet em modo edição) e ícone lixo (abre AlertDialog)
- Adicionar AlertDialog de confirmação com mensagem "Tens a certeza que queres apagar o processo PV-XXX?"

**Alterações em `src/hooks/useDeals.ts`**:
- Adicionar hook `useDeleteDeal` com mutation que apaga da tabela deals

**Alterações em `src/components/processos/AddDealSheet.tsx`**:
- Aceitar prop opcional `deal?: Deal` para modo edição
- Pré-preencher campos quando `deal` existe
- No submit: chamar `useUpdateDeal` em vez de `useCreateDeal`
- Título muda para "Editar Processo" quando em modo edição

### 3. Campo "Mês Reportado" com default

**Alteração em `src/components/processos/AddDealSheet.tsx`**:
- Inicializar `reportedMonth` com `format(new Date(), 'yy-MM')` em vez de string vazia (apenas quando não há deal para editar)

### Ficheiros a alterar

- `src/pages/Processos.tsx` — KPI fix, botões editar/apagar, AlertDialog
- `src/hooks/useDeals.ts` — adicionar `useDeleteDeal`
- `src/components/processos/AddDealSheet.tsx` — modo edição + default reported_month

