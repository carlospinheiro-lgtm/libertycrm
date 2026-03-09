

## Plano: Página de Consultores e integração com CRM Processual

### 1. Criar `src/pages/Consultores.tsx`

Página completa com:
- **Cabeçalho**: Título "Consultores" com ícone Users + botão azul "+ Novo Consultor"
- **Tabela**: Query `consultants` filtrada por `agency_id`. Colunas: Nome, NIF, Escalão (badge colorido A=azul/B=amarelo/C=cinza), % Comissão, Sistema, Equipa, Acumulado 12M (€), Ativo (Switch toggle), Ações (editar/apagar)
- **Sheet "Novo Consultor"**: Formulário com todos os campos (nome*, NIF, entry_date, tier Select A/B/C, commission_system Select, commission_pct, has_company toggle, team, team_leader, accumulated_12m, is_active toggle)
- **Edição**: Mesma Sheet pré-preenchida com dados existentes
- **Eliminar**: AlertDialog de confirmação → delete da tabela

### 2. Rota e Sidebar

- `App.tsx`: Adicionar rota `/consultores` → `Consultores`
- `Sidebar.tsx`: Adicionar item `{ icon: Users, label: 'Consultores', path: '/consultores' }` entre Pagamentos e Objetivos. Usar ícone `UserCheck` (para não conflitar com Users já usado no CRM Compradores)

### 3. Alterar `AddDealSheet.tsx` — Select de consultores

- Substituir o campo `Input` de "Consultor" por um `Select` que busca consultores ativos da tabela `consultants` (filtrado por `agency_id`)
- Ao selecionar consultor: preencher `consultantName` com o nome, e se o consultor tem `commission_pct`, preencher `consultantPct` automaticamente → recalcula `consultantCommission`

### Ficheiros a criar
- `src/pages/Consultores.tsx`

### Ficheiros a alterar
- `src/App.tsx` — nova rota
- `src/components/layout/Sidebar.tsx` — novo item no menu
- `src/components/processos/AddDealSheet.tsx` — Select de consultores

