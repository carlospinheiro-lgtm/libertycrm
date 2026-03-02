
# Reestruturacao CRM Vendedores - Modelo Minimalista

## Visao Geral

Reestruturar o modulo CRM Vendedores seguindo o mesmo padrao minimalista implementado nos Compradores: pipeline de 8 colunas, cartoes simples, ficha com qualificacao comercial, historico de interacoes, alertas visuais, automatizacoes ao mover e dashboard de metricas para diretores.

## 1. Migracao de Base de Dados

### 1.1 Novos campos na tabela `leads` (especificos vendedores)

- `property_type` (text) - tipo de imovel (apartamento, moradia, terreno, comercial, outro)
- `location` (text) - localizacao do imovel
- `estimated_value` (numeric) - valor estimado
- `seller_motivation` (text) - mudanca / partilha / divorcio / investimento / outro
- `seller_deadline` (text) - 0-30 / 30-90 / 90+
- `seller_exclusivity` (text) - sim / nao / indefinido
- `commission_percentage` (numeric) - percentagem de comissao
- `contract_duration` (text) - duracao do contrato

### 1.2 Nova tabela `seller_interactions`

Mesma estrutura de `buyer_interactions`:

```text
id (uuid, PK)
lead_id (uuid, FK -> leads.id)
agency_id (uuid, FK -> agencies.id)
type (text: call | meeting | email | whatsapp | stage_change | other)
note (text)
created_at (timestamptz)
created_by (uuid, FK -> profiles.id)
```

RLS: politicas com `has_agency_access`, imutaveis (sem UPDATE/DELETE).

### 1.3 Migracao de column_ids existentes

Mapear colunas antigas para novas (lead_type = 'seller'):

```text
'new'             -> 'novo'
'first-contact'   -> 'contacto-feito'
'meeting'         -> 'avaliacao'
'evaluation'      -> 'avaliacao'
'proposal-sent'   -> 'apresentacao'
'decision'        -> 'negociacao'
'signed'          -> 'angariacao'
'lost'            -> 'perdido-followup'
```

Qualquer column_id nao mapeado -> 'novo'.

## 2. Pipeline (8 Colunas)

| ID | Titulo | Cor |
|---|---|---|
| novo | Novo | blue |
| contacto-feito | Contacto Feito | cyan |
| avaliacao | Avaliacao / Estudo de Mercado | cyan |
| apresentacao | Apresentacao de Servicos | yellow |
| negociacao | Negociacao | yellow |
| angariacao | Angariacao | green |
| angariacao-reservada | Angariacao Reservada | green |
| perdido-followup | Perdido / Follow-up | red |

## 3. Componentes Novos

### 3.1 `SellerKanbanCard.tsx`

Cartao minimalista mostrando:
- Nome proprietario
- Telefone (clicavel)
- Tipo imovel + valor estimado (€)
- Temperatura (badge colorido)
- Ultimo contacto (dias, verde/laranja/vermelho)
- Proxima acao + data
- Alerta se >5 dias em "Avaliacao"
- Nome do agente (apenas se user != agente)

### 3.2 `SellerDetailsSheet.tsx`

Ficha com 3 tabs (Dados / Historico / Tarefas):

**Seccao Obrigatoria:**
- Tipo de imovel (select)
- Localizacao
- Valor estimado
- Proxima acao (obrigatoria a partir de "Contacto Feito")
- Data da proxima acao

**Seccao Comercial:**
- Motivacao: Mudanca / Partilha / Divorcio / Investimento / Outro
- Prazo venda: 0-30 / 30-90 / 90+
- Exclusividade: Sim / Nao / Indefinido
- Origem (readonly)

**Historico:** Timeline de seller_interactions com botoes rapidos.

**Tarefas:** Reutilizar useLeadTasks existente.

### 3.3 `SellerMetricsDashboard.tsx`

Metricas para diretores:
- Leads novas (semana)
- Avaliacoes realizadas (semana)
- Apresentacoes feitas (semana)
- Angariacoes (mes)
- Taxa Avaliacao -> Angariacao
- Angariacoes exclusivas vs nao exclusivas (requer campo exclusivity)
- Leads >7 dias sem contacto

### 3.4 `useSellerInteractions.ts`

Hook identico ao useBuyerInteractions, apontando para tabela `seller_interactions`.

## 4. Pagina LeadsVendedores.tsx

Reescrever completamente seguindo o padrao de LeadsCompradores:
- Separar em componente exterior (DashboardLayout) e interior (conteudo)
- useAgentFilter para filtragem por agente
- DndContext com drag-and-drop nos cartoes
- Automatizacoes ao mover:
  - "Avaliacao" -> tarefa "Preparar CMA"
  - "Apresentacao" -> tarefa "Enviar proposta de servicos"
  - "Negociacao" -> tarefa "Follow-up 3 dias"
  - "Angariacao" -> toast a pedir exclusividade/comissao/prazo
- logStageChange via seller_interactions

## 5. Alertas Visuais

Nos cartoes:
- Verde: < 3 dias sem contacto
- Laranja: 4-7 dias
- Vermelho: > 7 dias
- Alerta laranja se sem proxima acao
- Alerta especial se >5 dias na coluna "Avaliacao" (baseado em column_entered_at)

## Ficheiros Afetados

### Novos
- `src/components/kanban/SellerKanbanCard.tsx`
- `src/components/kanban/SellerDetailsSheet.tsx`
- `src/components/kanban/SellerMetricsDashboard.tsx`
- `src/hooks/useSellerInteractions.ts`

### Modificados
- `src/pages/LeadsVendedores.tsx` - reescrita completa
- `src/hooks/useLeads.ts` - adicionar novos campos seller ao DbLead e ao select

### Migracao SQL
- 1 ficheiro: adicionar campos seller, criar tabela seller_interactions, migrar column_ids
