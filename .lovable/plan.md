

## Plano: Melhorias ao CRM Recrutamento (Cartão + Página + Barra)

### 1. `src/components/kanban/RecruitmentKanbanCard.tsx` — Redesenho completo

Reescrever seguindo o padrão do `BuyerKanbanCard`:

- **Props**: Adicionar `onContactLogged`, `onQuickNote` callbacks
- **Imports**: `Card/CardContent`, `Popover`, `cn`, `date-fns`, `toast`, `Textarea`, `CheckCircle2`, `MessageSquarePlus`, `MoveHorizontal`, `Flame`, `Send`, `CSS` do dnd-kit/utilities
- **Estados internos**: `noteOpen/noteText`, `contactOpen/contactType/contactResult/contactNote`
- **Layout**:
  - Row 1: Nome + badge experiência (verde/azul)
  - Row 2: Badge "Recrutamento" roxo + origem com emoji (mapeamento `sourceIconMap`: instagram→📸, referencia→👥, site→🌐, etc.)
  - Row 3: Telefone clicável com `Phone` icon
  - Row 4: Dias sem contacto (verde ≤3d, laranja ≤7d, vermelho >7d) + 🔥 Flame se >14d
  - Row 5: Próxima ação — fundo `bg-destructive/10` se atrasada, `bg-warning/10` se hoje/amanhã, aviso laranja se sem ação
  - Row 6: Nome agente + ✓ Contactei (Popover com tipo/resultado/nota → `onContactLogged`) + Nota rápida (Popover com Textarea → `onQuickNote`) + Dropdown Mover (MoveHorizontal)
- **Estilos**: `border-l-4`, `border-l-destructive ring-1 ring-destructive/20` se >14d sem contacto, `border-l-orange-400` se entrevistado >5d, `touch-none`
- Usar `CSS.Translate.toString(transform)` e `handleCardClick` com guarda para `button/a/textarea`

### 2. `src/pages/Recrutamento.tsx` — Popup + barra superior

**Popup desativado**:
- `shouldShowMovePopup` retorna sempre `false`
- No `executeMove`, adicionar toasts especiais:
  - `integrado`: `"🎉 Parabéns! Novo consultor integrado. Não esqueças de criar o perfil de utilizador."`
  - `nao-avancou`: `"📋 Candidato arquivado. Define um follow-up para reativar no futuro."`
- `last_contact_at` já é atualizado em `logStageChange`

**Callbacks para cartão**:
- `handleContactLogged(leadId, type, note)`: insere em `recruitment_interactions` + atualiza `last_contact_at` no lead
- `handleQuickNote(leadId, note)`: insere em `recruitment_interactions` com `type: 'note'`
- Passar `onContactLogged` e `onQuickNote` ao `RecruitmentKanbanCard`

**Barra superior**:
- `searchTerm` state + `<Input>` com ícone `Search`, filtra `clientName` ou `phone` (case-insensitive)
- `expFilter` state: `'all' | 'com_experiencia' | 'sem_experiencia'` — 3 botões com contador
- `todayFilter` boolean no `ToggleGroup` — mostra só leads com `nextActionAt` para hoje (usando `isToday` de date-fns)
- Contadores calculados dos `mappedLeads` filtrados por agente

### 3. `src/components/kanban/RecruitmentDetailsSheet.tsx` — sem alterações

O pedido não inclui alterações a este ficheiro.

### Ficheiros editados
- `src/components/kanban/RecruitmentKanbanCard.tsx` — reescrita completa
- `src/pages/Recrutamento.tsx` — popup desativado, callbacks, barra de filtros

