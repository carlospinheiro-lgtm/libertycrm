

## Plano: Melhorar extrato e estado de pagamento

### 1. Consultar tabela `consultants` para enriquecer o cabeçalho

- Na página Pagamentos, fazer query à tabela `consultants` (por `agency_id`) para obter `tier` e `commission_pct` de cada consultor
- Fazer match por `name` entre `deals.consultant_name` e `consultants.name`

### 2. Cabeçalho do extrato (Sheet)

Acima da tabela, mostrar:
- **Nome** do consultor em destaque (h2/large)
- **Escalão** (tier) — badge se existir na tabela consultants
- **% comissão** — do consultant ou fallback 47%
- **Mês** selecionado

### 3. Botão "Marcar Pago" no fundo do extrato

- Botão azul no final do Sheet
- Ao clicar: `Popover` ou `AlertDialog` de confirmação com texto "Confirmar pagamento de X€ a [nome] em [data hoje]?"
- Ao confirmar: update `consultant_paid_date = today` em todos os deals do extrato via `useUpdateDeal` (batch)
- Toast de sucesso "Pagamento registado"
- Se já todos pagos, botão desabilitado com texto "Já pago"

### 4. Badge de estado na tabela principal

Nova coluna "Estado" na tabela de consultores:
- Se **todos** os deals do consultor têm `consultant_paid_date` preenchido → Badge verde "Pago" + data mais recente
- Senão → Badge cinza "Pendente"

### 5. Interface `ConsultantRow` atualizada

Adicionar campos: `isPaid`, `paidDate`, `tier`, `commissionPct`

### Ficheiros a alterar
- `src/pages/Pagamentos.tsx` — todas as alterações (query consultants, cabeçalho, botão, badge)

