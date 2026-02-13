

# Funcionalidade Excel para Leads Vendedores (Export + Import)

## Resumo

Ligar o botao de Download (icone vermelho) na pagina /leads-vendedores a um modal com duas tabs: **Exportar** (download Excel) e **Importar** (upload com preview, detecao de duplicados e confirmacao).

---

## 1. Alteracoes na Base de Dados

Adicionar colunas de metadados de importacao a tabela `leads`:

- `import_batch_id` (uuid, nullable) - ID do lote de importacao
- `imported_at` (timestamptz, nullable) - data da importacao
- `import_source` (text, nullable) - origem (ex: 'excel')
- `import_file_name` (text, nullable) - nome do ficheiro
- `imported_by_user_id` (uuid, nullable) - quem importou

---

## 2. Novos Ficheiros

### `src/components/kanban/LeadsExcelDialog.tsx`
Modal reutilizavel com duas tabs:

**Tab Exportar:**
- Botao "Descarregar Excel"
- Busca leads do tipo atual (seller) filtradas pela agencia
- Gera ficheiro .xlsx com colunas: Nome Cliente, Email, Telefone, Origem, Coluna, Temperatura, Notas, Data Entrada
- Nome do ficheiro: `leads_vendedores_<agencia>_<yyyy-mm-dd>.xlsx`

**Tab Importar:**
- Upload de .xlsx / .csv (reutiliza `parseFile` de `src/lib/excel-parser.ts`)
- Apos upload, mostra preview com contadores: total, validas, invalidas, novos, duplicados
- Detecao de duplicados por prioridade:
  1. Telefone
  2. Email
  3. Nome + Telefone
- Para cada duplicado, mostra comparacao "Atual vs Excel" com acoes: Atualizar / Ignorar / Criar Novo
- Opcao "Aplicar a todos"
- Botao "Confirmar Importacao" so aparece apos decisoes tomadas
- Ao confirmar, faz upsert/insert conforme decisoes e preenche campos de metadados de importacao

---

## 3. Alteracoes em Ficheiros Existentes

### `src/components/kanban/KanbanBoard.tsx`
- Adicionar prop `onExcelClick?: () => void` ao `KanbanBoardProps`
- Ligar o `onClick` do botao Download (linha 278) a esta prop

### `src/pages/LeadsVendedores.tsx`
- Adicionar estado `excelDialogOpen`
- Passar `onExcelClick={() => setExcelDialogOpen(true)}` ao KanbanBoard
- Renderizar `<LeadsExcelDialog>` com props: open, onOpenChange, agencyId, leadType, leads, columns

---

## 4. Detalhes Tecnicos

### Exportacao
- Utiliza a biblioteca `xlsx` (ja instalada) para gerar o ficheiro
- Busca leads ja carregadas no estado do componente (sem query adicional)
- Mapeia campos da DB para nomes de colunas em portugues

### Importacao - Fluxo
```text
Upload ficheiro
      |
      v
Parse com parseFile()
      |
      v
Normalizar colunas (reutilizar padrao de excel-parser.ts)
      |
      v
Para cada linha:
  - Validar campos obrigatorios (client_name)
  - Procurar duplicado na BD por telefone > email > nome+telefone
  - Classificar: novo / duplicado / invalido
      |
      v
Mostrar preview com contadores e tabela
      |
      v
Utilizador decide duplicados
      |
      v
"Confirmar Importacao"
      |
      v
Insert novos + Update/Ignore duplicados conforme decisao
Preencher import_batch_id, imported_at, etc.
      |
      v
Mostrar resumo final (criados, atualizados, ignorados, erros)
```

### Detecao de Duplicados
A pesquisa de duplicados e feita client-side contra as leads ja carregadas (filtradas por agencia e lead_type), sem queries adicionais. Prioridade:
1. Match por `phone` (exato, apos limpeza de espacos)
2. Match por `email` (case-insensitive)
3. Match por `client_name` + `phone`

### Logging
Cada importacao cria um registo em `import_jobs` com type='leads', summary_json com contadores e diff_json com alteracoes aplicadas.

