
# Plano de Implementacao — Renomear Menus, Atualizar Colunas CRM Compradores, Melhorar Cards e Filtro Global de Agente

---

## 1. Renomear itens do sidebar e titulos internos

### Ficheiros a modificar

**`src/components/layout/Sidebar.tsx`** (linhas 38-42):
- "Leads Compradores" -> "CRM Compradores"
- "Leads Vendedores" -> "CRM Vendedores"
- "Angariacoes" -> "CRM Angariacoes"
- "Recrutamento" -> "CRM Recrutamento"
- "Gestao Processual" -> "CRM Processual"

**`src/pages/LeadsCompradores.tsx`** (linha 101):
- KanbanBoard title: "Leads Compradores" -> "CRM Compradores"

**`src/pages/LeadsVendedores.tsx`** (linha 100):
- KanbanBoard title: "Leads Vendedores" -> "CRM Vendedores"

**`src/pages/Recrutamento.tsx`** (linha 60):
- KanbanBoard title: "Recrutamento de Agentes" -> "CRM Recrutamento"

**`src/pages/Processos.tsx`** (linha 70):
- Titulo h1: "Gestao Processual & Credito" -> "CRM Processual & Credito"

**`src/pages/Angariacoes.tsx`** (linha 22):
- Titulo h1: "Angariacoes" -> "CRM Angariacoes"

Nota: Todos os outros menus (Dashboard, Mapa de Atividades, Contas Correntes, Objetivos, Projetos, Agenda, Administracao, Origens) ficam INALTERADOS.

---

## 2. CRM Compradores — Atualizar colunas do Kanban

**`src/pages/LeadsCompradores.tsx`** — Substituir o array `buyerColumns`:

Colunas finais (12 colunas):
```text
new          -> Novo Contacto (blue)
first-contact -> Primeiro Contacto (cyan)
qualifying   -> Em Qualificacao (cyan)
visits       -> Visitas Agendadas (yellow)
proposal     -> Proposta Apresentada (yellow)
negotiation  -> Em Negociacao (yellow)
won          -> Fechado - Ganhamos (green)
followup-0-3 -> Follow-up 0-3 Meses (purple)
followup-3-6 -> Follow-up 3-6 Meses (purple)
followup-6+  -> Follow-up +6 Meses (purple)
no-interest  -> Sem Interesse (red)
disqualified -> Lead Desqualificada (grey)
```

A coluna `lost` sera removida e substituida por `no-interest` e `disqualified`.

Para as cores lilac/purple, criar entradas custom no KanbanColumn component ou usar o valor `purple` existente. Adicionar suporte para cores especificas via propriedades opcionais `bgTint` e `borderColor` no tipo Column.

**`src/components/kanban/KanbanColumn.tsx`** — Adicionar suporte para cores `purple` e `grey` no mapeamento de cores (se nao existir).

---

## 3. Kanban Cards — Adicionar "Ultimo contacto" indicator

Os cards ja incluem a maioria dos elementos pedidos (avatar com iniciais, telefone clicavel, badge de origem, budget range, agente, aging pill, borda de prioridade, acoes rapidas). Falta adicionar:

**`src/components/kanban/KanbanCard.tsx`**:
- Adicionar indicador "Ultimo contacto: X dias" na parte inferior do card
  - Usar dados de `lead_activities` ou `column_entered_at` como proxy
  - Cores: verde <3 dias, amarelo 3-7 dias, vermelho >7 dias
- Adicionar icone de tarefa (calendario) e nota (texto) nos quick actions
- Renomear tooltips das acoes rapidas conforme especificado

Os quick actions atuais ja incluem telefone, WhatsApp, email e mover. Adicionar:
- Calendario (Agendar tarefa)
- Nota (Adicionar nota)

---

## 4. Filtro Global de Agente — TopBar persistente

### Novo contexto: `AgentFilterContext`

Criar **`src/contexts/AgentFilterContext.tsx`**:
- Estado: `selectedAgentId: string | 'all'`
- Logica: se o utilizador tem role de agente (sem roles de diretor/admin), fixa o filtro no proprio ID e desabilita o dropdown
- Se diretor/admin, mostra dropdown com todos os agentes da agencia
- Persistencia via `useState` no contexto (persiste entre navegacao de paginas)

### Modificar `src/components/layout/TopBar.tsx`:
- Adicionar dropdown de filtro de agente entre a pesquisa e o seletor de agencia
- Dropdown lista agentes ativos na agencia (query a `profiles` + `user_agencies`)
- Para agentes: mostrar apenas o seu nome, dropdown desabilitado
- Para diretores/admins: dropdown com "Todos os Agentes" + lista

### Modificar `src/components/layout/DashboardLayout.tsx`:
- Envolver com `AgentFilterProvider`

### Modificar `src/pages/LeadsCompradores.tsx` e `src/pages/LeadsVendedores.tsx`:
- Consumir `useAgentFilter()` do contexto
- Filtrar leads por `agentId` quando filtro ativo
- Remover o filtro de agente local do `KanbanBoard.tsx` (duplicado)

### Modificar `src/components/kanban/KanbanBoard.tsx`:
- Consumir o filtro global de agente do contexto em vez do filtro local
- Manter o filtro de agencia local

---

## Resumo de ficheiros

### Criar
| Ficheiro | Descricao |
|----------|-----------|
| `src/contexts/AgentFilterContext.tsx` | Contexto global para filtro de agente |

### Modificar
| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/layout/Sidebar.tsx` | Renomear 5 labels |
| `src/pages/LeadsCompradores.tsx` | Renomear titulo + atualizar colunas |
| `src/pages/LeadsVendedores.tsx` | Renomear titulo |
| `src/pages/Recrutamento.tsx` | Renomear titulo |
| `src/pages/Processos.tsx` | Renomear titulo |
| `src/pages/Angariacoes.tsx` | Renomear titulo |
| `src/components/kanban/KanbanCard.tsx` | Adicionar "ultimo contacto" + acoes extras |
| `src/components/kanban/KanbanColumn.tsx` | Suporte para cores purple/grey |
| `src/components/layout/TopBar.tsx` | Adicionar dropdown filtro agente global |
| `src/components/layout/DashboardLayout.tsx` | Envolver com AgentFilterProvider |
| `src/components/kanban/KanbanBoard.tsx` | Usar filtro global de agente |

### Sem alteracoes na base de dados
Nao e necessaria nenhuma migracao SQL. Todas as alteracoes sao frontend.
