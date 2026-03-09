

## Plano: Renomear e simplificar botões de progressão de estado

### Alterações

**1. `src/components/processos/DealDetailsSheet.tsx`** (linhas 32-36)

Atualizar `STATUS_ACTIONS`:
- Estado 0: label `"Registar Nº Fatura"`, classe cinza/neutra (`bg-gray-600 text-white hover:bg-gray-700`)
- Estado 1: label `"Marcar Recebido"`, classe verde (mantém)
- Estado 2: label `"Confirmar Pagamento ao Consultor"`, classe azul (`bg-blue-600 text-white hover:bg-blue-700`)

**2. `src/components/processos/StatusChangeDialog.tsx`** (linhas 20-24)

Atualizar `CONFIGS`:
- Estado 0: title `"Registar Nº Fatura"`, buttonLabel `"Registar"`, classe cinza (`bg-gray-600 text-white hover:bg-gray-700`)
- Estado 1: title `"Marcar Recebido"`, buttonLabel `"Confirmar"`, classe verde (mantém)
- Estado 2: title `"Confirmar Pagamento ao Consultor"`, buttonLabel `"Confirmar"`, classe azul (`bg-blue-600 text-white hover:bg-blue-700`)

Também renomear o label `"Data Emissão"` → `"Data Fatura"` (linha 112) para consistência.

### Ficheiros a alterar
- `src/components/processos/DealDetailsSheet.tsx`
- `src/components/processos/StatusChangeDialog.tsx`

