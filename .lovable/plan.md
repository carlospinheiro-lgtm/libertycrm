
# Reestruturar CRM Recrutamento - Modelo Minimalista

## Visao Geral

Reestruturar o modulo de Recrutamento seguindo o mesmo padrao minimalista implementado em Compradores e Vendedores: pipeline de 7 colunas, cartoes simples, ficha com qualificacao, historico de interacoes, alertas visuais, automatizacoes ao mover e dashboard de metricas RH.

## 1. Migracao de Base de Dados

### 1.1 Novos campos na tabela `leads` (especificos recrutamento)

- `experience_level` (text) - com_experiencia / sem_experiencia
- `recruitment_source` (text) - referral / linkedin / site / outro (reutiliza `source` existente, nao precisa campo extra)

Nota: `cv_url` ja existe na tabela. `last_contact_at`, `next_action_text`, `next_action_at` tambem ja existem. Apenas `experience_level` e novo.

### 1.2 Nova tabela `recruitment_interactions`

Mesma estrutura das outras tabelas de interacoes:

```text
id (uuid, PK)
lead_id (uuid, FK -> leads.id)
agency_id (uuid, FK -> agencies.id)
type (text: call | meeting | email | whatsapp | stage_change | other)
note (text)
created_at (timestamptz, default now())
created_by (uuid, FK -> profiles.id)
```

RLS: has_agency_access para SELECT e INSERT, imutavel (false para UPDATE/DELETE).

### 1.3 Migracao de column_ids existentes

Mapear colunas antigas para novas (lead_type = 'recruitment'):

```text
'new'                  -> 'novo-lead'
'first-contact'        -> 'contactado'
'interview-scheduled'  -> 'entrevista-agendada'
'interview-done'       -> 'entrevistado'
'decision'             -> 'em-decisao'
'training'             -> 'integrado'
'active'               -> 'integrado'
'rejected'             -> 'nao-avancou'
```

Qualquer column_id nao mapeado -> 'novo-lead'.

## 2. Pipeline (7 Colunas)

| ID | Titulo | Cor |
|---|---|---|
| novo-lead | Novo Lead | blue |
| contactado | Contactado | cyan |
| entrevista-agendada | Entrevista Agendada | yellow |
| entrevistado | Entrevistado | yellow |
| em-decisao | Em Decisao | yellow |
| integrado | Integrado | green |
| nao-avancou | Nao Avancou | red |

## 3. Componentes Novos

### 3.1 `RecruitmentKanbanCard.tsx`

Cartao minimalista mostrando:
- Nome do candidato
- Telefone (clicavel)
- Experiencia (badge: Com / Sem)
- Origem
- Ultimo contacto (dias, verde/laranja/vermelho)
- Proxima acao + data
- Alerta se >5 dias em "Entrevistado" sem decisao
- Nome do agente (apenas se user != agente)

### 3.2 `RecruitmentDetailsSheet.tsx`

Ficha com 3 tabs (Dados / Historico / Tarefas):

**Seccao Obrigatoria:**
- Nome, telefone, email
- Experiencia (Com / Sem)
- CV (upload/link)
- Proxima acao (obrigatoria a partir de "Contactado")
- Data da proxima acao

**Seccao Qualificacao:**
- Origem
- Temperatura

**Historico:** Timeline de recruitment_interactions com botoes rapidos (Chamada, WhatsApp, Email, Reuniao).

**Tarefas:** Reutilizar useLeadTasks existente.

### 3.3 `RecruitmentMetricsDashboard.tsx`

Metricas para RH/diretores:
- Leads novas (semana)
- Entrevistas agendadas (semana)
- Entrevistas realizadas (semana)
- Integrados (mes)
- Taxa conversao Entrevista -> Integrado
- Leads >7 dias sem contacto

### 3.4 `useRecruitmentInteractions.ts`

Hook identico ao useBuyerInteractions, apontando para tabela `recruitment_interactions`.

## 4. Pagina Recrutamento.tsx

Reescrever completamente seguindo o padrao de LeadsCompradores:
- Separar em componente exterior (DashboardLayout) e interior (conteudo)
- useAgentFilter para filtragem
- DndContext com drag-and-drop
- Automatizacoes ao mover:
  - "Contactado" -> tarefa "Agendar entrevista" (due +2 dias)
  - "Entrevista Agendada" -> tarefa "Lembrete entrevista" (due +1 dia)
  - "Entrevistado" -> tarefa "Follow-up decisao" (due +3 dias)
- logStageChange via recruitment_interactions

## 5. Alertas Visuais

Nos cartoes:
- Verde: < 3 dias sem contacto
- Laranja: 4-7 dias
- Vermelho: > 7 dias
- Alerta se sem proxima acao definida
- Alerta especial se >5 dias na coluna "Entrevistado" (baseado em column_entered_at)

## 6. Detalhes Tecnicos

### Ficheiros Novos
- `src/components/kanban/RecruitmentKanbanCard.tsx`
- `src/components/kanban/RecruitmentDetailsSheet.tsx`
- `src/components/kanban/RecruitmentMetricsDashboard.tsx`
- `src/hooks/useRecruitmentInteractions.ts`

### Ficheiros Modificados
- `src/pages/Recrutamento.tsx` - reescrita completa
- `src/hooks/useLeads.ts` - adicionar `experience_level` ao DbLead

### Migracao SQL
- 1 ficheiro: adicionar campo experience_level, criar tabela recruitment_interactions com RLS, migrar column_ids

A tabela `leads` continua a ser reutilizada (lead_type = 'recruitment'). O campo `experience_level` e nullable e so usado para recrutamento. Os campos `last_contact_at`, `next_action_text`, `next_action_at` ja existem e sao reutilizados.
