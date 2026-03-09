

## Plano: Página de Importação Maxwork

### Migração DB

Adicionar coluna `parish` à tabela `deals` (text, nullable) para mapear "Freguesia" do ficheiro.

### Criar `src/pages/Importacao.tsx`

Página com 3 tabs usando `Tabs` do shadcn:

**Tab Processos (SaleProcesses.xls)**
- Upload XLSX → parse com `xlsx` library (já instalada)
- Preview tabela com 5 primeiras linhas
- Mapeamento de colunas conforme especificado (Título→pv_number, Imóvel→maxwork_id, etc.)
- `deal_status`: "Receb. em falta"→1, "Concluído"→3, outros→0
- Cada linha gera 2 registos deals (Angariação + Venda) com campos distintos
- Detecção interna: se Agência Angariadora = Agência Comprador ∈ {"Liberty","Liberty II"}
- Verificação duplicados por `pv_number + deal_type` antes de inserir
- Dialog de decisão: "Atualizar existentes" ou "Ignorar duplicados"
- Botão "Importar X processos" com progresso e toast

**Tab Consultores (CommissionSystem.xlsx)**
- Upload → preview 5 linhas
- Mapeamento: Utilizador→name, Agente NIF→nif, Data de Adesão→entry_date, Escalão→tier, Tipo de Sistema→commission_system, Empresa→has_company, Honorários %→commission_pct, Faturação Último Ano→accumulated_12m
- Upsert por `nif` (se existe→atualiza, senão→cria)
- Botão "Importar X consultores" + toast

**Tab Equipas (Teams.xlsx)**
- Upload → preview 5 linhas
- Por NIF, atualiza `team` e `team_leader` na tabela consultants
- Lógica team_leader: se "Chefe de Equipa?"=true → team_leader = próprio nome; senão → encontrar o líder da mesma equipa no ficheiro
- Botão "Importar equipas" + toast

### Sidebar

Adicionar `{ icon: Upload, label: 'Importação', path: '/importacao' }` ao array `adminMenuItems` (secção Configurações).

### App.tsx

Adicionar rota `/importacao` → `Importacao`.

### Ficheiros
- **Migração**: adicionar `parish` a `deals`
- **Criar**: `src/pages/Importacao.tsx`
- **Editar**: `src/App.tsx`, `src/components/layout/Sidebar.tsx`

