

## Plano: Formulário "Novo Processo" + Ficha do Processo

### Ficheiros a criar

1. **`src/components/processos/AddDealSheet.tsx`** — Sheet lateral com formulário de criação
   - Campos obrigatórios: pv_number, deal_type (Select), consultant_name, sale_value, commission_pct, address
   - Campos opcionais: municipality, partner_agency, process_manager, reported_month, buyer_name, buyer_nif, cpcv_date, cpcv_pct (default 100%), deed_date, deed_pct (default 100%), notes
   - Cálculo automático: commission_store = sale_value × commission_pct / 100 (campo read-only, editável manualmente)
   - Insert na tabela deals com agency_id do user e deal_status=0
   - Toast de sucesso + invalidação do query cache + fecho da sheet

2. **`src/components/processos/DealDetailsSheet.tsx`** — Sheet lateral 680px com ficha completa
   - Cabeçalho: Nº PV + badge tipo + badge estado + botões de mudança de estado
   - 5 Tabs: Resumo, CPCV & Escritura, Financeiro, Pagamentos, Notas
   - Cada tab com campos editáveis inline + botão "Guardar" por tab
   - Botões de estado condicionais:
     - status 0 → "Emitir Fatura" (pede invoice_number, invoice_date, invoice_value) → status 1
     - status 1 → "Marcar Recebido" (pede received_date) → status 2
     - status 2 → "Pagar Consultor" (pede consultant_paid_date) → status 3
   - Cada mudança insere registo em deal_history

3. **`src/components/processos/StatusChangeDialog.tsx`** — Dialog para mudança de estado (3 variantes conforme o status actual)

### Ficheiros a modificar

4. **`src/hooks/useDeals.ts`** — Adicionar mutations: createDeal, updateDeal, changeStatus (com insert em deal_history)

5. **`src/pages/Processos.tsx`** — Integrar:
   - Estado `newDealOpen` para abrir AddDealSheet nos botões "+ Novo Processo" e "Adicionar primeiro processo"
   - Estado `selectedDeal` para abrir DealDetailsSheet ao clicar "Ver"

### Detalhes técnicos

- Usar react-hook-form + zod para validação no formulário de criação
- Usar useMutation do react-query com invalidação de `['deals']`
- DatePicker com Popover + Calendar (seguindo padrão shadcn com `pointer-events-auto`)
- deal_history insert: `{ deal_id, agency_id, changed_by: currentUser.id, old_status, new_status, note }`
- Tabs via componente Tabs do shadcn
- Sheet width 680px via className override no SheetContent

