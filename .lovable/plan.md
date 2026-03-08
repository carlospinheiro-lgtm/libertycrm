

## Plano: Sistema de Comissionamento Configurável

### Abordagem
Usar a tabela `agency_settings` existente com JSONB — 3 chaves novas: `commission_table`, `commission_split`, `commission_rental`. Sem migration necessária.

### 1. Hook `useAgencySettings.ts` — novos tipos e hooks

```typescript
export interface CommissionTier {
  from: number; to: number | null; fee1: string; fee2: string;
}
export interface CommissionTableSettings { tiers: CommissionTier[]; }
export interface CommissionSplitSettings {
  agentSplit: number; // % angariador
  coMediacaoSplit: number; // % co-mediação
}
export interface CommissionRentalSettings { months: number; }
```

Hooks: `useCommissionTable`, `useCommissionSplit`, `useCommissionRental` — cada um com fallback para valores padrão.

### 2. `SettingsPanel.tsx` — secção "Comissionamento"

Novo componente `CommissionSettingsCard` com 3 sub-secções:

**2a. Tabela de Honorários (Venda)**
- Tabela editável com colunas: De, Até, Honorário 1, Honorário 2
- 5 linhas pré-preenchidas com os valores pedidos
- Cada célula editável inline (Input)
- Botão "+" para adicionar linha, "×" para remover
- Botão "Guardar Tabela"
- Nota: "Valores em regime de exclusividade. IVA acresce sempre."

**2b. Arrendamento**
- Input numérico "Honorários de arrendamento" (default 1.5)
- Texto: "Número de rendas mensais cobradas como honorário."
- Botão "Guardar"

**2c. Divisão de Comissão**
- 2 pares de inputs linked (somam 100%): angariador/vendedor e co-mediação
- Ao alterar um, o outro ajusta automaticamente
- Botão "Guardar Divisões"

### 3. `CommissionCalculator.tsx` — componente reutilizável

Novo ficheiro `src/components/commission/CommissionCalculator.tsx`:
- Props: `propertyValue`, `isExclusivity`, `agencyId`, `onSelectCommission?`
- Carrega `useCommissionTable` e `useCommissionSplit` para a agência
- Calcula honorários com base no escalão correspondente ao valor
- Mostra: "Honorário recomendado: X€ (opção 1) ou Y€ (opção 2)"
- Toggle para escolher opção 1 ou 2
- Mostra divisão: "Angariador: X€ | Vendedor: X€"
- Mostra IVA: "IVA (23%) não incluído — acresce X€"
- Inputs editáveis para override da divisão neste negócio
- Botão "Aplicar" que chama `onSelectCommission` com o valor final em %

### 4. `SellerDetailsSheet.tsx` — integração

Após o campo "Valor Estimado (€)" (linha ~325), adicionar botão "💰 Calcular comissão" que abre `<Popover>` com `CommissionCalculator`:
- Passa `propertyValue` do form, `agencyId`, `isExclusivity` do form
- `onSelectCommission` atualiza `form.commission_percentage`

### Ficheiros editados
- `src/hooks/useAgencySettings.ts` — tipos + 3 hooks
- `src/components/admin/SettingsPanel.tsx` — `CommissionSettingsCard`
- `src/components/commission/CommissionCalculator.tsx` — novo
- `src/components/kanban/SellerDetailsSheet.tsx` — popover calculadora

