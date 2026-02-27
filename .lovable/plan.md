
# Modulo Angariacoes — Plano de Implementacao

Este modulo e o mais complexo ate agora: uma pagina de listagem, uma pagina de detalhe com Kanban interno de 5 colunas, checklists por etapa, gestao de media/portais, visitas, documentos e contratos. Proponho dividir em sub-fases dentro desta implementacao.

---

## Fase A — Base de Dados e Infraestrutura

### Tabela `properties` (imoveis angariados)
```text
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  lead_id uuid REFERENCES leads(id),
  reference text UNIQUE NOT NULL,
  created_by uuid,
  assigned_agent uuid,
  -- Dados do imovel
  property_type text NOT NULL DEFAULT 'apartamento',
  address text,
  parish text,
  city text DEFAULT 'Braga',
  area_m2 numeric,
  rooms integer,
  bedrooms integer,
  bathrooms integer,
  floor text,
  garage boolean DEFAULT false,
  energy_certificate text,
  asking_price numeric NOT NULL DEFAULT 0,
  minimum_price numeric,
  -- Contrato
  contract_type text NOT NULL DEFAULT 'exclusive',
  contract_start_date date,
  contract_end_date date,
  contract_duration_months integer DEFAULT 6,
  commission_percentage numeric,
  -- Pipeline
  current_stage text NOT NULL DEFAULT 'documentos',
  stage_entered_at timestamptz DEFAULT now(),
  -- Media
  cover_photo_url text,
  video_url text,
  virtual_tour_url text,
  -- Status
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS via `has_agency_access`
- Indices em `agency_id`, `status`, `current_stage`

### Tabela `property_photos`
```text
CREATE TABLE property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  order_index integer DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Tabela `property_checklist_items`
```text
CREATE TABLE property_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  stage text NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  is_optional boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### Tabela `property_visits`
```text
CREATE TABLE property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL,
  visit_date timestamptz NOT NULL,
  buyer_name text,
  buyer_contact text,
  agent_id uuid,
  outcome text DEFAULT 'medium_interest',
  feedback text,
  follow_up_created boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Tabela `property_portals`
```text
CREATE TABLE property_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  is_published boolean DEFAULT false,
  portal_url text,
  publish_date date,
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Tabela `property_documents`
```text
CREATE TABLE property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  expiry_date date,
  version integer DEFAULT 1,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);
```

### Tabela `property_activities` (timeline)
```text
CREATE TABLE property_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Storage
- Bucket `property-photos` (publico para display)
- Bucket `property-documents` (privado)

### Sequencia para referencia
```text
CREATE SEQUENCE property_reference_seq START 1;
```

---

## Fase B — Sidebar + Routing + Pagina de Listagem

### Sidebar (`Sidebar.tsx`)
Adicionar "Angariacoes" entre "Leads Vendedores" e "Recrutamento":
- Icone: `Building` (lucide-react)
- Path: `/angariacoes`
- Permissoes: mesmas dos leads vendedores

### Router (`App.tsx`)
- Rota `/angariacoes` → pagina `Angariacoes.tsx`
- Rota `/angariacoes/:id` → pagina `AngariacaoDetalhe.tsx`

### Pagina `Angariacoes.tsx` — Lista
- Summary bar no topo: Total Ativas, Em Exclusividade, Nao Exclusividade, A Expirar (30d), Expiradas
- Toggle lista/grid
- Filtros: Agente, Estado, Tipo Imovel, Exclusividade, Portais
- Tabela com: foto thumbnail, referencia, morada, tipo badge, preco, agente, contrato pill, countdown expirar, stage pill, icones portais
- Quick actions hover: Ver Detalhe, Agendar Visita, Nota
- Export CSV/PDF
- SEM botao "+ Nova Angariacao" (criacao automatica via Leads Vendedores)

### Hook `useProperties.ts`
- CRUD para tabela `properties` com joins para fotos, portais, agente
- Query filtrada por `agency_id`

---

## Fase C — Pagina de Detalhe da Angariacao

### Layout duas colunas
- Esquerda (60%): Kanban interno de 5 colunas
- Direita (40%): Painel de tabs

### Kanban Interno (5 colunas)
Colunas: Recolha de Documentos | Avaliacao | Publicacao | Visitas | Negociacao

Cores:
- Documentos: blue (#EBF4FF / #3B82F6)
- Avaliacao: purple (#F5F3FF / #8B5CF6)
- Publicacao: teal (#F0FDFA / #14B8A6)
- Visitas: amber (#FFFBEB / #F59E0B)
- Negociacao: orange (#FFF7ED / #F97316)

Card unico por angariacao mostra: foto, morada, referencia, preco, aging pill, progress bar checklist, proxima tarefa, avatar agente.

Logica de drag: so permite arrastar se checklist completa. Se incompleta, warning com opcao Confirmar/Cancelar.

### Checklists por Etapa
Items hardcoded por default (configuráveis via Admin futuramente):
- Documentos: 7 items (Caderneta, Certidao, Licenca, Certificado Energetico, ID Proprietario, Comprovativo nao divida, Planta)
- Avaliacao: 4 items
- Publicacao: 8 items
- Visitas: 4 items
- Negociacao: 5 items

Componente `PropertyChecklist.tsx` renderiza items com checkboxes, progress bar, timestamps de conclusao.

### Tabs do Painel Direito

**Tab Resumo**: Detalhes imovel, preco/preco minimo, contrato (tipo, datas, comissao, dias restantes com cor), contacto proprietario, agente, botao "Renovar Contrato" (modal simples).

**Tab Media e Portais**: Galeria fotos (upload multiplo, drag reorder, set cover), video URL, virtual tour URL, toggles por portal (Idealista, Imovirtual, Website) com URL e data publicacao.

**Tab Visitas**: Lista de visitas, botao "Registar Visita" (formulario rapido), stats (total, breakdown interesse, media/mes), botao "Enviar Relatorio ao Proprietario".

**Tab Documentos**: Upload categorizado, tipos predefinidos, preview inline PDF, campo data expirar, historico versoes.

**Tab Historico e Notas**: Timeline completa (mudancas etapa, checklist, visitas, documentos, notas, renovacoes contrato), filtro por tipo, adicionar nota inline.

---

## Fase D — Integracao com Leads Vendedores

### Trigger automatico
Quando o contrato de mediacao e guardado no modal de Leads Vendedores (coluna "Contrato de Mediacao" ou equivalente), criar automaticamente:
1. Registo na tabela `properties` com dados do lead + contrato
2. Checklist items default para a primeira etapa
3. Portais default (Idealista, Imovirtual, Website — todos nao publicados)
4. Activity log "Angariacao criada"

### Validacao contrato minimo 4 meses
No modal de Leads Vendedores, campo duracao tem `min=4` com mensagem inline: "O contrato de mediacao tem uma duracao minima de 4 meses."

---

## Fase E — Alertas de Expiracao de Contrato

- Dashboard widget (futuro): "Contratos a Expirar"
- Calculo na listagem: countdown com cores (verde >60d, amarelo 30-60d, vermelho <30d)
- Badge "Contrato Expirado" (cinza) quando contract_end_date < hoje
- Opcoes em imovel expirado: Renovar / Fechar / Arquivar
- Renovacao: modal simples (minimo 4 meses), atualiza end_date, regista na timeline

---

## Ficheiros a Criar

| Ficheiro | Descricao |
|----------|-----------|
| `src/pages/Angariacoes.tsx` | Pagina lista angariacoes |
| `src/pages/AngariacaoDetalhe.tsx` | Pagina detalhe com Kanban + tabs |
| `src/components/angariacoes/PropertyListTable.tsx` | Tabela/grid de angariacoes |
| `src/components/angariacoes/PropertySummaryBar.tsx` | Barra resumo no topo |
| `src/components/angariacoes/PropertyStageKanban.tsx` | Kanban interno 5 colunas |
| `src/components/angariacoes/PropertyChecklist.tsx` | Checklist por etapa |
| `src/components/angariacoes/PropertySummaryTab.tsx` | Tab resumo |
| `src/components/angariacoes/PropertyMediaTab.tsx` | Tab media e portais |
| `src/components/angariacoes/PropertyVisitsTab.tsx` | Tab visitas |
| `src/components/angariacoes/PropertyDocumentsTab.tsx` | Tab documentos |
| `src/components/angariacoes/PropertyHistoryTab.tsx` | Tab historico e notas |
| `src/components/angariacoes/RenewContractDialog.tsx` | Modal renovacao contrato |
| `src/components/angariacoes/LogVisitDialog.tsx` | Modal registar visita |
| `src/hooks/useProperties.ts` | CRUD properties |
| `src/hooks/usePropertyChecklist.ts` | CRUD checklist items |
| `src/hooks/usePropertyVisits.ts` | CRUD visitas |
| `src/hooks/usePropertyDocuments.ts` | CRUD documentos |
| `src/hooks/usePropertyActivities.ts` | Timeline atividades |
| `src/hooks/usePropertyPortals.ts` | CRUD portais |

### Ficheiros a Modificar

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/layout/Sidebar.tsx` | Adicionar item "Angariacoes" |
| `src/App.tsx` | Adicionar rotas `/angariacoes` e `/angariacoes/:id` |

---

## Resumo de Complexidade

Este modulo e o maior da aplicacao ate agora. Envolve:
- 7 tabelas novas + 2 storage buckets
- 2 paginas novas (lista + detalhe)
- ~15 componentes novos
- ~6 hooks novos
- Kanban interno com logica de checklists
- Integracao com Leads Vendedores existente

Recomendo implementar em ordem: DB migration → Sidebar/Router → Lista → Detalhe (Kanban + Tabs) → Integracao Vendedores → Alertas.
