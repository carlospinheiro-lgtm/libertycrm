

## Plano: Configuração de duração de contrato de angariação

### Abordagem
Usar a tabela `agency_settings` existente com JSONB (chave `contract_duration`), sem necessidade de migration. O hook `useAgencySettings.ts` já suporta chaves genéricas via `useAgencySetting<T>`.

### 1. Sem migration necessária
A tabela `agency_settings` já armazena configurações em JSONB com `setting_key` + `setting_value`. Basta usar uma nova chave `contract_duration` com valor `{ defaultDays: 120, options: [90, 120, 150, 180] }`.

### 2. Hook `useAgencySettings.ts`
Adicionar tipos e funções helper:

```typescript
export interface ContractDurationSettings {
  defaultDays: number;
  options: number[];
}

export function useContractDurationSettings(agencyId: string | undefined) {
  return useAgencySetting<ContractDurationSettings>(agencyId, 'contract_duration');
}
```

### 3. `SettingsPanel.tsx`
Após o `LeadSettingsCard`, adicionar nova secção "Contratos de Angariação" (visível quando `selectedAgencyId` existe):
- Input numérico "Duração padrão (dias)"
- Lista de badges editáveis com opções de duração (90d, 120d, etc.) + botão "+" para adicionar + "×" para remover
- Botão "Guardar" que usa `useUpsertAgencySetting` com chave `contract_duration`
- Nota informativa em texto muted

### 4. `SellerDetailsSheet.tsx` (linha ~386-389)
Substituir o `<Input>` de texto livre por um `<Select>`:
- Importar `useContractDurationSettings`
- Carregar opções da agência, fallback `[90, 120, 150, 180]`
- Mostrar como "90 dias", "120 dias", etc.
- Valor padrão = `defaultDays` da agência (ou 120)

### 5. `AddLeadDialog.tsx`
Quando `leadFlow === 'vendedores'`:
- Adicionar campo `contractDuration` ao `formData`, pré-preenchido com `defaultDays`
- Renderizar `<Select>` com as mesmas opções dinâmicas
- Incluir no `newLead` como `contract_duration`

### Ficheiros editados
- `src/hooks/useAgencySettings.ts` — adicionar tipos e hook
- `src/components/admin/SettingsPanel.tsx` — nova secção de contratos
- `src/components/kanban/SellerDetailsSheet.tsx` — Select dinâmico
- `src/components/kanban/AddLeadDialog.tsx` — campo duração para vendedores

