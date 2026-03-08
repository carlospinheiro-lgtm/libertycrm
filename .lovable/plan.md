

## Plano: Melhorias CRM Vendedores (paridade com Compradores)

### Ficheiro 1: `src/components/kanban/SellerKanbanCard.tsx`

**Adicionar popover "Contactei"** — igual ao BuyerKanbanCard:
- Nova prop `onContactLogged?: (leadId: string, type: string, note: string) => void`
- Estado local: `contactOpen`, `contactType`, `contactResult`, `contactNote`
- Botão CheckCircle2 com Popover contendo: tipo (Chamada/WhatsApp/Email/Visita), resultado (Atendeu/Não atendeu/Callback), nota rápida, botão Guardar
- `handleSaveContact` compõe nota com resultado + texto e chama `onContactLogged`
- Substituir o click handler do card por `handleCardClick` que ignora cliques em buttons/links
- Importar: `useState`, `Popover`, `PopoverContent`, `PopoverTrigger`, `CheckCircle2`, `Send`, `cn`, `toast`
- Reorganizar zona de ações: CheckCircle2 + Mover lado a lado

### Ficheiro 2: `src/pages/LeadsVendedores.tsx`

**1. Pesquisa por nome/telefone:**
- Estado `searchQuery` com `<Input>` e ícone Search na barra de header
- Filtro em `agentAndSearchLeads` (mesmo padrão de LeadsCompradores)

**2. Filtros de temperatura:**
- Array `temperatureFilters` com Todos/Quente/Morno/Frio (sem "indefinido")
- Estado `tempFilter`, botões com contadores calculados sobre `agentAndSearchLeads`
- `filteredLeads` = `agentAndSearchLeads` filtrado por temperatura

**3. Vista "Hoje":**
- Adicionar valor `myday` ao ToggleGroup com label texto "Hoje"
- `viewMode` passa a `'cards' | 'list' | 'myday'`
- `myDayLeads` filtra leads com `nextActionAt` para hoje (usando `isToday` de date-fns)
- Renderiza como lista de cards quando activo

**4. Simplificar move popup:**
- `shouldShowMovePopup` retorna sempre `false`
- No `executeMove`: toast especial para `angariacao` ("🎉 Parabéns! Preenche exclusividade, comissão e prazo na ficha.") e `perdido-followup` ("📋 Lead movida para Perdido. Define um follow-up para reativar.")

**5. onContactLogged:**
- Função `handleContactLogged(leadId, type, note)` que insere em `seller_interactions` e atualiza `last_contact_at` no lead
- Passa como prop ao SellerKanbanCard

**Importações adicionais em LeadsVendedores:** `Input`, `Search`, `Flame`, `Thermometer`, `Snowflake` de lucide-react, `useMemo` de react, `isToday` de date-fns

**Sem migrações de base de dados necessárias.**

