

# Reestruturacao CRM Compradores - Modelo Minimalista

## Visao Geral

Reestruturar completamente o modulo de Leads Compradores com pipeline simplificado de 8 colunas, cartoes minimalistas, ficha de comprador com qualificacao, historico de interacoes, alertas automaticos e dashboard de metricas para o diretor comercial.

## 1. Migracao de Base de Dados

### 1.1 Novos campos na tabela `leads`

Adicionar campos especificos para compradores:

- `zones` (text[]) - zonas de interesse
- `typology` (text) - tipologia pretendida
- `last_contact_at` (timestamptz) - data do ultimo contacto
- `next_action_text` (text) - texto da proxima acao
- `next_action_at` (timestamptz) - data da proxima acao
- `buyer_motive` (text) - HPP / Investimento / Arrendamento
- `buyer_timeline` (text) - 0-30 / 30-90 / 90+
- `buyer_financing` (text) - sim / nao / em_analise

### 1.2 Nova tabela `buyer_interactions`

```text
id (uuid, PK)
lead_id (uuid, FK -> leads.id)
agency_id (uuid, FK -> agencies.id)
type (text: call | whatsapp | email | meeting | other)
note (text)
created_at (timestamptz)
created_by (uuid, FK -> profiles.id)
```

RLS: mesmas regras da agencia (has_agency_access).

### 1.3 Migracao de column_ids existentes

Mapear colunas antigas para novas:

```text
'new', ''          -> 'novo'
'first-contact'    -> 'contacto-feito'
'qualifying'       -> 'qualificacao'
(sem equivalente)  -> 'ativo'        (nova)
'visits'           -> 'visitas'
'proposal'         -> 'proposta-negociacao'
'negotiation'      -> 'proposta-negociacao'
'won'              -> 'reserva-cpcv'
'followup-0-3'     -> 'perdido-followup'
'followup-3-6'     -> 'perdido-followup'
'followup-6+'      -> 'perdido-followup'
'no-interest'      -> 'perdido-followup'
'disqualified'     -> 'perdido-followup'
```

Tudo feito via `UPDATE leads SET column_id = ... WHERE lead_type = 'buyer'`.

## 2. Pipeline (Kanban) - 8 Colunas

Substituir `buyerColumns` em `LeadsCompradores.tsx`:

| ID | Titulo | Cor |
|---|---|---|
| novo | Novo | blue |
| contacto-feito | Contacto Feito | cyan |
| qualificacao | Qualificacao | cyan |
| ativo | Ativo (Imoveis enviados) | yellow |
| visitas | Visitas | yellow |
| proposta-negociacao | Proposta / Negociacao | yellow |
| reserva-cpcv | Reserva / CPCV | green |
| perdido-followup | Perdido / Follow-up | red |

## 3. Cartao Kanban Minimalista

Criar componente `BuyerKanbanCard.tsx` especifico para compradores com apenas:

- Nome do contacto
- Telefone (clicavel)
- Orcamento (formatado, ou "---" se nao definido)
- Zona principal (primeira zona do array)
- Temperatura (hot/warm/cold) com badge colorido
- Ultimo contacto (X dias, verde/laranja/vermelho)
- Proxima acao + data
- Nome do agente (apenas se utilizador logado != agente da lead)

Remover: notas longas, campos secundarios, quick actions excessivas (manter apenas mover).

## 4. Ficha do Comprador (LeadDetailsSheet)

Criar `BuyerDetailsSheet.tsx` com:

### Seccao Obrigatoria (sempre visivel)
- Orcamento min/max
- Zonas (tags editaveis)
- Tipologia (select: T0, T1, T2, T3, T4+)
- Proxima acao (texto + data)
- A partir de "Contacto Feito": proxima acao e obrigatoria

### Seccao Qualificacao (compacta)
- Motivo: HPP / Investimento / Arrendamento
- Prazo: 0-30d / 30-90d / 90+d
- Financiamento: Sim / Nao / Em analise
- Origem (readonly)

### Aba Historico
- Timeline cronologica de `buyer_interactions`
- Botoes rapidos: + Chamada, + WhatsApp, + Email, + Reuniao
- Registo automatico de mudancas de coluna

### Aba Tarefas (reutilizar existente)

## 5. Alertas Automaticos (visuais nos cartoes)

Baseados em `last_contact_at`:
- Verde: < 3 dias
- Laranja: 4-7 dias
- Vermelho: > 7 dias
- Alerta laranja se `next_action_at` nao definido

Implementado directamente no componente do cartao, sem backend extra.

## 6. Automatizacoes ao Mover

Ao mover lead para certas colunas, criar tarefas automaticas via `lead_tasks`:

- "Visitas" -> tarefa "Confirmar visita" (due_date = amanha)
- "Proposta / Negociacao" -> tarefa "Follow-up proposta" (due_date = +2 dias)
- "Reserva / CPCV" -> toast a sugerir criacao de Processo

Registar automaticamente uma `buyer_interaction` do tipo `stage_change`.

Actualizar `last_contact_at` sempre que se regista uma interacao.

## 7. Dashboard Metricas (Diretor Comercial)

Criar componente `BuyerMetricsDashboard.tsx` no topo da pagina (visivel apenas para diretores/admins):

- Leads novas (semana)
- Leads contactadas (semana)
- Leads qualificadas (semana)
- Visitas marcadas (semana)
- Propostas apresentadas (mes)
- Reservas (mes)
- Lista de leads >7 dias sem contacto

Dados obtidos via queries ao Supabase com filtros temporais.

## 8. UX

- Drag-and-drop no cartao inteiro (ja funciona assim com dnd-kit)
- Sidebar ja recolhe em mobile (existente)
- Interface 100% em Portugues (manter)

## Ficheiros Afetados

### Novos ficheiros
- `src/components/kanban/BuyerKanbanCard.tsx`
- `src/components/kanban/BuyerDetailsSheet.tsx`
- `src/components/kanban/BuyerMetricsDashboard.tsx`
- `src/hooks/useBuyerInteractions.ts`

### Ficheiros modificados
- `src/pages/LeadsCompradores.tsx` - novo pipeline, usar componentes especificos
- `src/hooks/useLeads.ts` - suportar novos campos (zones, typology, etc.)
- `src/hooks/useKanbanState.ts` - tipos actualizados

### Migracao SQL
- 1 ficheiro: adicionar campos, criar tabela, migrar column_ids

## Detalhes Tecnicos

A tabela `leads` continua a ser usada (nao criar `buyer_leads` separada) para manter compatibilidade com importacoes e os outros modulos. Os novos campos sao nullable e so usados quando `lead_type = 'buyer'`.

A tabela `buyer_interactions` e separada de `lead_activities` porque tem schema diferente (tipo de contacto especifico vs actividade generica).

O mapeamento de colunas antigas e feito via SQL `UPDATE` na migracao, garantindo que nenhuma lead fica "orfan" sem coluna valida.

