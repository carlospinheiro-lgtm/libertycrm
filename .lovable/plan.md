

## Plano: Melhorias no BuyerDetailsSheet.tsx

### Alterações no ficheiro `src/components/kanban/BuyerDetailsSheet.tsx`

#### 1. Corrigir bug da data vermelha (linha 295)
O botão do Popover da "Data da ação" já usa `variant="outline"` — o problema não existe. Confirmar que `cn()` não aplica estilos destrutivos. A classe actual é correcta: `text-muted-foreground` quando vazio. Nenhuma alteração necessária aqui.

#### 2. Tradução completa
Verificar todos os textos — já estão maioritariamente em PT-PT. Pequenos ajustes: placeholders como "Nova tarefa..." → manter, confirmar que tudo é consistente.

#### 3. Histórico de notas (aba "Histórico")
- Adicionar secção "Notas" com botão "+ Adicionar nota" que expande um `Textarea`
- Ao guardar, chama `addInteraction.mutate()` com `type: 'note'`
- Na timeline, filtrar notas (type=note) com ícone 📝 e mostrar separadamente acima da timeline de contactos
- Adicionar `'note'` ao `interactionTypeConfig`

#### 4. Histórico de contactos melhorado
- Na timeline, mostrar ícone, tipo, resultado (extraído da nota), data/hora formatada em PT e nome do agente
- Usar `format(date, "d 'de' MMMM 'às' HH:mm", { locale: pt })` em vez de `formatDistanceToNow`

#### 5. Agendamento de visitas (aba "Tarefas")
- Adicionar secção "Visitas" com botão "+ Agendar visita" que expande campos: data, hora, morada/imóvel, notas
- Guardar em `lead_tasks` com título `"Visita: {morada}"` e data
- Separar visitas (título começa com "Visita:") das tarefas normais
- Visitas futuras com fundo highlight, passadas a cinza

#### 6. Mover lead / Duplicar para outro pipeline (aba "Dados")
- Adicionar secção "Mover lead" após Qualificação e antes dos botões de ação
- Dropdown "Pipeline" com opções: CRM Compradores / CRM Vendedores
- Dropdown "Etapa" com colunas do pipeline selecionado (hardcoded, conforme memória)
- Botão "Mover" que chama `onSave` com `column_id` e potencialmente `lead_type` actualizado
- Botão "Duplicar para CRM Vendedores" (visível quando pipeline=compradores) — precisa de callback novo no props
- Toast de confirmação em PT

### Alterações na interface `BuyerDetailsSheetProps`
- Adicionar prop `onDuplicate?: (leadId: string, targetColumnId: string) => void` para duplicação
- Adicionar prop `columns?: KanbanColumn[]` para saber as colunas actuais

### Alterações em `src/pages/LeadsCompradores.tsx`
- Passar as novas props `onDuplicate` e `columns` ao `BuyerDetailsSheet`
- Implementar `handleDuplicate` que insere lead no pipeline vendedores via Supabase

### Secção técnica

**Tabelas afectadas (sem alterações de schema):**
- `buyer_interactions` — inserção com `type: 'note'` (já suportado, campo text)
- `lead_tasks` — inserção com título prefixado "Visita:" (já suportado)
- `leads` — update de `column_id` e `lead_type` + insert para duplicação

**Sem migrações necessárias.** Todas as tabelas já suportam os dados requeridos.

**Ficheiros a editar:**
1. `src/components/kanban/BuyerDetailsSheet.tsx` — todas as 6 melhorias
2. `src/pages/LeadsCompradores.tsx` — passar novas props e implementar duplicação

