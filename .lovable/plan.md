
# Liberty CRM — Plano de Implementacao Faseado

Este pedido cobre 12+ modulos principais. Implementar tudo de uma vez seria arriscado e impossivel de testar. Proponho uma abordagem faseada, priorizando por impacto e dependencias.

---

## Fase 1 — Kanban Cards Enriquecidos + Lead Detail Panel

**Prioridade: Alta** | Impacto imediato na usabilidade dos modulos existentes.

### 1A. Melhorar KanbanCard.tsx
Adicionar ao cartao existente:
- Avatar/iniciais do contacto (circulo colorido)
- Badge da origem (Idealista, Website, etc.) — ja existe como `lead.source`
- Budget range (novo campo `budget_min`, `budget_max` na tabela `leads`)
- Aging pill: dias na coluna atual (calcular a partir de `entry_date` ou novo campo `column_entered_at`)
  - Verde: menos de 7 dias, Amarelo: 7-14 dias, Vermelho: mais de 14 dias
- Prioridade: borda esquerda colorida (novo campo `priority` na tabela `leads`)
  - Cinza=Baixa, Azul=Normal, Vermelho=Alta, Preto=Urgente
- Quick actions no hover: Registar chamada, Agendar, Nota, Mover

### 1B. Lead Detail Panel (Sheet lateral)
Substituir o `LeadDetailsDialog` atual (modal centrado) por um `Sheet` lateral direito com tabs:
- **Resumo** — dados chave, budget, preferencias, RGPD, NIF
- **Atividade** — timeline cronologica (novo — requer tabela `lead_activities`)
- **Tarefas** — tarefas vinculadas (novo — requer tabela `lead_tasks`)
- **Documentos** — ficheiros carregados (Storage bucket)
- **Propostas** — lista de propostas (Fase 2)
- **Notas** — notas com timestamp

### 1C. Nova Lead Modal Melhorado (multi-step)
Substituir `AddLeadDialog` por formulario em 4 passos:
1. Identificacao: nome, telefone, email, NIF, idioma
2. Origem e Classificacao: source, tipo, urgencia, budget, agente
3. Preferencias do Imovel: tipologia, localizacao, quartos, area, features
4. RGPD: checkbox consentimento + data

### DB Changes (Fase 1):
```text
ALTER TABLE leads ADD COLUMN budget_min numeric DEFAULT NULL;
ALTER TABLE leads ADD COLUMN budget_max numeric DEFAULT NULL;
ALTER TABLE leads ADD COLUMN priority text DEFAULT 'normal';
ALTER TABLE leads ADD COLUMN nif text DEFAULT NULL;
ALTER TABLE leads ADD COLUMN language text DEFAULT 'pt';
ALTER TABLE leads ADD COLUMN rgpd_consent boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN rgpd_consent_date timestamptz DEFAULT NULL;
ALTER TABLE leads ADD COLUMN column_entered_at timestamptz DEFAULT now();

CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  activity_type text NOT NULL, -- 'call','email','note','stage_change','task','document'
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE lead_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to uuid,
  title text NOT NULL,
  description text,
  due_date date,
  status text DEFAULT 'pending', -- 'pending','done','cancelled'
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```
- RLS policies baseadas em `has_agency_access` via join com leads
- Storage bucket `lead-documents` para upload de ficheiros

### Ficheiros a criar/modificar:
- `src/components/kanban/KanbanCard.tsx` — redesign com novos campos
- `src/components/kanban/LeadDetailsSheet.tsx` — substituir dialog por sheet com tabs
- `src/components/kanban/AddLeadDialog.tsx` — multi-step form
- `src/hooks/useLeadActivities.ts` — CRUD para atividades
- `src/hooks/useLeadTasks.ts` — CRUD para tarefas

---

## Fase 2 — Propostas (Leads Compradores)

**Prioridade: Alta** | Funcionalidade core do negocio.

### 2A. Trigger na coluna "Proposta Apresentada"
- No `KanbanBoard.tsx`, interceptar drag para a coluna `proposal`
- Card fica com borda pulsante amarela (CSS animation)
- Modal obrigatorio de 5 passos abre automaticamente
- Se cancelar, card volta a coluna anterior

### 2B. Modal de Proposta (5 passos)
```text
Step 1 — Dados da Proposta:
  Numero auto (PROP-YYYY-XXXX), data, validade (+15d),
  tipo (Venda/Arrendamento), valor, metodo pagamento,
  financiamento, sinal, data escritura

Step 2 — Dados do Cliente:
  Auto-preenchido da lead, editavel, co-titular

Step 3 — Dados do Imovel:
  Pesquisa/selecao ou entrada manual,
  tipologia, area, condicoes

Step 4 — Condicoes Especiais:
  Rich text + checklist configuravel

Step 5 — Revisao e Acao:
  Preview formatado
  Botoes: Rascunho, PDF+Email, PDF+WhatsApp, Apenas PDF
```

### 2C. Badge de status no card
- Rascunho (cinza), Enviada (azul), Em Analise (amarelo), Aceite (verde), Recusada (vermelho), Contra-Proposta (roxo)
- Aceite: auto-avanca para "Em Negociacao"

### DB Changes (Fase 2):
```text
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  agency_id uuid NOT NULL,
  proposal_number text UNIQUE NOT NULL,
  proposal_date date NOT NULL DEFAULT CURRENT_DATE,
  validity_date date,
  deal_type text NOT NULL, -- 'venda','arrendamento'
  proposed_value numeric NOT NULL,
  payment_method text, -- 'comptado','financiamento','misto'
  mortgage_amount numeric,
  bank text,
  approval_status text,
  down_payment numeric,
  down_payment_date date,
  deed_date date,
  -- Cliente
  client_name text,
  client_nif text,
  client_address text,
  client_email text,
  client_phone text,
  co_titular_name text,
  co_titular_nif text,
  -- Imovel
  property_address text,
  property_typology text,
  property_area numeric,
  property_reference text,
  condition_notes text,
  inspection_required boolean DEFAULT false,
  inspection_deadline date,
  -- Condicoes
  special_conditions text,
  conditions_checklist jsonb DEFAULT '[]',
  -- Status
  status text DEFAULT 'draft', -- 'draft','sent','analysis','accepted','rejected','counter'
  rejection_reason text,
  pdf_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS via `has_agency_access`

### Ficheiros a criar:
- `src/components/proposals/ProposalWizard.tsx` — modal 5 passos
- `src/components/proposals/ProposalPreview.tsx` — preview formatado
- `src/hooks/useProposals.ts` — CRUD
- `src/lib/proposal-pdf.ts` — geracao PDF (jsPDF)

---

## Fase 3 — Leads Vendedores (colunas atualizadas + Contrato de Mediacao)

### 3A. Atualizar colunas
Mudar as colunas existentes em `LeadsVendedores.tsx` para:
```text
Novo Contacto, Primeiro Contacto, Em Qualificacao,
Imovel Avaliado, Contrato de Mediacao, Imovel Publicado,
Em Negociacao, Fechado - Ganhamos, Fechado - Perdemos
```
Com cores: Blue, Blue, Blue, Amber, Amber, Teal, Teal, Green, Red

### 3B. Trigger "Contrato de Mediacao"
Modal obrigatorio ao arrastar para esta coluna:
- Tipo contrato (Exclusividade / Nao Exclusividade)
- Duracao (meses), Comissao (%), Detalhes imovel, Data assinatura, Notas
- Gerar PDF resumo do contrato

### DB Changes:
```text
CREATE TABLE mediation_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id),
  agency_id uuid NOT NULL,
  contract_type text NOT NULL, -- 'exclusive','non_exclusive'
  duration_months integer,
  commission_percentage numeric,
  signing_date date,
  property_details jsonb,
  notes text,
  pdf_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
```

---

## Fase 4 — Gestao Processual (substituir mock)

Substituir o mock atual em `Processos.tsx` por modulo funcional:
- Toggle Kanban / Tabela
- Colunas: Proposta Aceite, Documentacao, CPCV Assinado, Financiamento, Escritura Marcada, Escritura Realizada, Processo Concluido
- Cada processo liga a: lead comprador + vendedor, imovel, proposta, agente
- Checklist de documentos configuravel
- Alertas de deadlines (amarelo 7d, vermelho 3d)

### DB: tabela `processes` com campos para datas chave, checklist, status

---

## Fase 5 — Agenda

Substituir ComingSoon por modulo funcional:
- Vistas: Mes, Semana, Dia, Lista
- Tipos de evento: Visita, Reuniao, Chamada, Escritura, CPCV, Outro
- Ligacao a Lead / Imovel / Processo
- Cor por tipo de evento
- Quick create ao clicar no calendario

### DB: tabela `calendar_events`

---

## Fase 6 — Mapa de Atividades + Contas Correntes

### 6A. Mapa de Atividades
Feed de atividades com filtros (agente, data, tipo)
- Baseado na tabela `lead_activities` da Fase 1
- Export PDF/CSV

### 6B. Contas Correntes
Tracking financeiro por deal:
- Comissao esperada/recebida, status pagamento
- Filtros por agente, mes, status
- Resumo totais
- Export CSV

### DB: tabela `financial_entries`

---

## Fase 7 — Admin Enhancements (Branding, Templates, RGPD)

- Tab Branding: upload logos (sidebar, login, PDF, favicon) via Storage
- Tab Templates: templates email/WhatsApp com merge tags
- Tab RGPD: retencao dados, log consentimento
- Tab Propostas: configuracoes default, disclaimer, AMI, checklist

### DB: storage bucket `branding`, tabelas `email_templates`, `rgpd_settings`

---

## Resumo de Prioridades

| Fase | Descricao | Complexidade |
|------|-----------|-------------|
| 1 | Cards enriquecidos + Detail Panel + Nova Lead | Media-Alta |
| 2 | Propostas (modal 5 passos + PDF) | Alta |
| 3 | Vendedores (colunas + Contrato Mediacao) | Media |
| 4 | Gestao Processual funcional | Alta |
| 5 | Agenda | Media |
| 6 | Atividades + Contas Correntes | Media |
| 7 | Admin (Branding, Templates, RGPD) | Media |

Recomendo implementar **Fase 1 primeiro** — e as enriquecimentos dos cards do Kanban e o painel de detalhes da lead. Isto da valor imediato e estabelece a base para as fases seguintes (propostas dependem do detail panel, processos dependem de propostas, etc.).

Devo avancar com a Fase 1?
