

## Plano: Correções ao Cartão e Ficha de Recrutamento

### 1. `RecruitmentKanbanCard.tsx` — Badge temperatura + experiência

**Interface**: Adicionar campos `candidateProfession`, `candidateZone`, `candidateMotivation`, `candidateNotes` ao `RecruitmentCardLead`.

**Row 1**: Manter nome + badge experiência (já existe mas condicionado a `lead.experienceLevel` — remover o `&&` guard para mostrar sempre, com fallback "N/D"). Adicionar badge temperatura ao lado:
- `hot` → `🔥 Quente` vermelho
- `warm` → `☀️ Morno` amarelo  
- `cold` → `❄️ Frio` azul

Definir `tempBadgeConfig` com cores e labels. Remover qualquer ícone/botão de temperatura solto fora do card (não existe atualmente — confirmar que não há).

### 2. `RecruitmentDetailsSheet.tsx` — Dialog centrado

**Imports**: Substituir `Sheet/SheetContent/SheetHeader/SheetTitle` por `Dialog/DialogContent` de `@/components/ui/dialog`. Adicionar `CalendarIcon` de lucide, `Calendar` de `@/components/ui/calendar`, `Popover/PopoverContent/PopoverTrigger`, `format` e `pt` de date-fns.

**Container**: `<Dialog>` + `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">`.

### 3. Cabeçalho com avatar + botões

Dentro do DialogContent, antes das Tabs:
- Div com `p-6 pb-0`
- Avatar circular `bg-purple-600` com iniciais (2 primeiras letras do nome)
- Nome em `text-lg font-bold` + Badge "Recrutamento" roxo
- 3 botões: "Ligar" (`href=tel:`) azul, "Email" (`href=mailto:`) cinza, "WhatsApp" (`href=https://wa.me/`) verde

### 4. Temperatura como botões visuais

Substituir `<Select>` da temperatura por 4 botões inline:
- `🔥 Quente` — `bg-red-100 text-red-700` quando ativo
- `☀️ Morno` — `bg-amber-100 text-amber-700` quando ativo
- `❄️ Frio` — `bg-blue-100 text-blue-700` quando ativo
- `○ Indefinido` (value `''`) — `bg-gray-100 text-gray-600` quando ativo

### 5. Calendário visual

Substituir `<Input type="date">` por `<Popover>` + `<Calendar mode="single">` com `pointer-events-auto`. Botão mostra data formatada em português via `format(date, "d 'de' MMMM yyyy", { locale: pt })` ou "Selecionar data".

### 6. Origem como Select

Substituir `<Input disabled>` da origem por `<Select>` editável com opções:
`📸 Instagram`, `📘 Facebook`, `👥 Referência`, `🌐 Website`, `🏠 Idealista`, `📱 Redes Sociais`, `🚶 Walk-in`, `🎤 Evento`, `📋 Outro`

Adicionar `source` ao form state e ao `handleSave`.

### 7. Campos extra — Perfil do Candidato

Após o campo CV, nova secção "Perfil do Candidato" com:
- `candidate_profession` — Input, placeholder "Ex: Assistente Comercial"
- `candidate_zone` — Input, placeholder "Ex: Braga, Guimarães"
- `candidate_motivation` — Select: Progressão de carreira / Maior rendimento / Reconversão profissional / Desempregado / Empreendedorismo / Outro
- `candidate_notes` — Textarea, placeholder "Observações sobre o candidato..."

Adicionar ao form state, inicializar no `useEffect` a partir de `lead.candidateProfession` etc., incluir no `handleSave`.

### 8. Migration SQL

Adicionar colunas à tabela `leads`:
```sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS candidate_profession text,
  ADD COLUMN IF NOT EXISTS candidate_zone text,
  ADD COLUMN IF NOT EXISTS candidate_motivation text,
  ADD COLUMN IF NOT EXISTS candidate_notes text;
```

### Ficheiros editados
- `src/components/kanban/RecruitmentKanbanCard.tsx` — interface + row 1 badges
- `src/components/kanban/RecruitmentDetailsSheet.tsx` — reescrita completa
- Migration SQL — 4 novas colunas em `leads`

