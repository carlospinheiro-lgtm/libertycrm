

## Plano: Simplificar botões de mudança de estado

### Alterações em `src/components/processos/StatusChangeDialog.tsx`

1. **Renomear** "Emitir Fatura" → "Registar Fatura", "Confirmar Fatura" → "Registar"
2. **Status 0 → 1**: Remover campos `invoiceValue` e `invoiceRecipient` — manter apenas Nº Fatura (text) e Data Emissão (date)
3. **Status 1 → 2**: Remover o Select de mês — manter apenas Data Recebimento; calcular `received_month` automaticamente com `format(receivedDate, 'yy-MM')`
4. **Status 2 → 3**: Sem alterações (já tem apenas Data Pagamento)
5. Limpar state e imports não utilizados (`invoiceValue`, `invoiceRecipient`, `receivedMonth`, `Select`, `generateMonthOptions`)

### Detalhe dos campos guardados por transição

```text
0 → 1: invoice_number, invoice_date                    (deal_status = 1)
1 → 2: received_date, received_month (auto "YY-MM")    (deal_status = 2)
2 → 3: consultant_paid_date                            (deal_status = 3)
```

### Ficheiro a alterar

`src/components/processos/StatusChangeDialog.tsx`

