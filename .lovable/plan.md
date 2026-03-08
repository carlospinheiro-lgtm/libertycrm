

## Plano: Aplicação múltipla de configurações entre agências

### Resumo
Adicionar ao `SettingsPanel.tsx` um sistema que permite selecionar múltiplas agências e aplicar configurações a todas de uma vez, incluindo confirmação via AlertDialog e funcionalidade de copiar definições entre agências.

### Alterações em `src/components/admin/SettingsPanel.tsx`

#### 1. Seletor de agências múltiplas (substitui o Select atual)
- Substituir o `<Select>` de agência única por um componente com checkboxes para cada agência
- Estado `selectedAgencyIds: string[]` (por defeito a primeira agência ou a do utilizador)
- `primaryAgencyId` = primeiro da lista selecionada (usado para carregar os valores nos formulários)
- Botões "Selecionar todas" e "Limpar seleção"
- Faixa amarela `bg-yellow-50 border-yellow-200` quando `selectedAgencyIds.length > 1`: "As alterações guardadas serão aplicadas a todas as agências selecionadas"

#### 2. Wrapper de save multi-agência com AlertDialog
- Importar `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` de `@/components/ui/alert-dialog`
- Criar estado `pendingSave: { fn: () => void } | null` para controlar o AlertDialog
- Função `handleMultiSave(saveFn)`: se `selectedAgencyIds.length > 1`, abre AlertDialog com lista de agências; senão executa diretamente
- No AlertDialog: "Vais aplicar estas definições a: Braga, Barcelos. Confirmas?" + botões Cancelar / Confirmar
- Cada `saveFn` recebe agencyIds e faz loop de `upsertAgencySetting` para cada ID
- Toast: "Definições aplicadas a N agências"

#### 3. Modificar os saves existentes
- `ContractDurationCard` e `CommissionSettingsCard` passam a receber `agencyIds: string[]` em vez de `agencyId: string`
- Cada `handleSave/saveTable/saveRental/saveSplits` faz `Promise.all` de mutations para todos os `agencyIds`
- Antes de executar, passa pelo wrapper de confirmação se `agencyIds.length > 1`

#### 4. Botão "Copiar definições de outra agência"
- Botão secundário no topo, junto ao seletor
- Abre `<Dialog>` com:
  - Dropdown para escolher agência de origem
  - Preview resumido: duração padrão, n.º escalões, divisão agente/vendedor
  - Botão "Copiar para agências selecionadas"
- Ao confirmar: lê todos os `agency_settings` da agência origem via query, insere/atualiza nas agências destino
- Toast: "Definições copiadas de X para: Y, Z"

### Importações adicionais
- `AlertDialog` + subcomponentes de `@/components/ui/alert-dialog`
- `Dialog, DialogContent, DialogHeader, DialogTitle` de `@/components/ui/dialog`
- `Checkbox` de `@/components/ui/checkbox`
- `AlertTriangle, Copy` de `lucide-react`
- `supabase` de `@/integrations/supabase/client` (para query direta de copy)

### Estrutura de componentes
- `AgencyMultiSelector` — checkboxes + botões selecionar/limpar + faixa amarela
- `ConfirmMultiApplyDialog` — AlertDialog reutilizável
- `CopySettingsDialog` — Dialog com preview e copy
- `ContractDurationCard` e `CommissionSettingsCard` recebem `agencyIds[]`

### Ficheiro editado
- `src/components/admin/SettingsPanel.tsx` — todas as alterações num único ficheiro

