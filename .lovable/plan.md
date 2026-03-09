

## Plano: Apagar página Processos e criar tabelas deals/deal_history

### 1. Apagar página Processos
- Substituir `src/pages/Processos.tsx` por um placeholder `ComingSoon`
- Atualizar `src/App.tsx`: remover import de `Processos`, usar `ComingSoon` na rota `/processos`
- **Sidebar não é tocado** — já aponta para `/processos` e fica funcional

### 2. Migration: Tabela `deals`
Criar tabela com todos os campos pedidos (id UUID PK, agency_id, pv_number, maxwork_id, deal_type, address, municipality, sale_value, commission_pct, commission_store, commission_remax, margin, partner_agency, side_fraction, consultant_name, consultant_commission, deal_status, invoice_number, invoice_date, invoice_value, invoice_total_vat, invoice_recipient, partner_invoice_number, cpcv_date, cpcv_pct, deed_date, deed_pct, conditional, signal_value, signal_returned, deed_days, docs_missing, received_date, consultant_paid_date, partner_paid_date, buyer_nif, buyer_name, archive_ref, notes, financing_value, financing_bank, financing_status, financing_commission, reported_month, received_month, process_manager, discount_pct, expense_discount, primary_margin, closed, created_at, updated_at).

Ativar RLS com 4 políticas CRUD baseadas em `has_agency_access(auth.uid(), agency_id)`.

Trigger `update_updated_at_column` em deals.

### 3. Migration: Tabela `deal_history`
Criar tabela (id UUID PK, deal_id FK deals CASCADE, agency_id, changed_by, old_status, new_status, note, created_at).

Ativar RLS com políticas SELECT e INSERT baseadas em `has_agency_access`. UPDATE/DELETE bloqueados (imutável, padrão de auditoria).

### Ficheiros alterados
- `src/pages/Processos.tsx` — apagado (substituído por redirect a ComingSoon)
- `src/App.tsx` — rota `/processos` usa `ComingSoon`
- 1 migration SQL para ambas as tabelas

