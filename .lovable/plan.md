

## Plano: Implementar Ficha de Detalhe do Processo

### Análise do código existente

O `DealDetailsSheet.tsx` já tem a estrutura completa implementada:
- Cabeçalho com Nº PV + badges de tipo e estado
- Botão de mudança de estado no cabeçalho
- 5 tabs (Resumo, CPCV, Financeiro, Pagamentos, Notas)
- Botão "Guardar" em cada tab

O `StatusChangeDialog.tsx` já implementa os 3 fluxos de mudança de estado com os campos corretos.

### Problemas identificados

1. **Falta o campo `invoice_recipient`** no diálogo de emissão de fatura (status 0 → 1)
2. **Falta o campo `received_month`** no diálogo de recebimento (status 1 → 2)
3. O `changed_by` está a guardar o `user.id` (UUID) em vez do nome do utilizador

### Alterações a implementar

**Ficheiro: `src/components/processos/StatusChangeDialog.tsx`**

1. Adicionar campo `invoice_recipient` (Destinatário) no formulário de emissão de fatura
2. Adicionar campo `received_month` (Mês Recebimento) no formulário de recebimento
3. Guardar nome do utilizador em vez do UUID no `changed_by`

### Detalhes técnicos

```text
Estado 0 → 1 (Emitir Fatura):
  Campos: Nº Fatura, Data Emissão, Valor Fatura, Destinatário
  Extra fields: invoice_number, invoice_date, invoice_value, invoice_recipient
  
Estado 1 → 2 (Marcar Recebido):
  Campos: Data Recebimento, Mês Recebimento (select YYYY-MM)
  Extra fields: received_date, received_month
  
Estado 2 → 3 (Pagar Consultor):
  Campos: Data Pagamento
  Extra fields: consultant_paid_date
```

O hook `useChangeStatus` no `useDeals.ts` precisa usar o nome do utilizador (do `currentUser`) em vez do `user.id` para o campo `changed_by`.

