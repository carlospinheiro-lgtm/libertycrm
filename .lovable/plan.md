

## Objetivo

Implementar três funcionalidades na área de Projetos:

1. **Correção de bug**: O EditTaskDialog tem o mesmo erro que o AddTaskDialog (SelectItem com value="")
2. **Gestão de membros**: Garantir acesso fácil à funcionalidade de adicionar membros
3. **Edição de projetos**: Permitir editar o nome, descrição e outras propriedades dos projetos
4. **Dashboard de estatísticas**: Mostrar cartões resumo no topo da página de projetos

---

## Implementação

### A) Corrigir bug no EditTaskDialog

O ficheiro `src/components/projects/EditTaskDialog.tsx` tem o mesmo problema que já corrigimos no AddTaskDialog: usa `value=""` no SelectItem, o que causa o erro do Radix UI.

**Alteração (linha 135-141)**:
- Mudar o valor do Select para usar `_none` internamente
- Converter `_none` de volta para string vazia no onValueChange
- Inicializar o valor corretamente no useEffect

---

### B) Adicionar botão de "Membros" acessível para o PM

A funcionalidade de adicionar membros já existe e está implementada, mas só aparece quando o utilizador é PM e clica em "Membros". Verificar que o botão está visível para o PM na página de detalhe do projeto.

- **Nota**: Esta funcionalidade já está operacional no `ProjetoDetalhe.tsx` (linha 121-124)
- O PM pode clicar em "Membros" e depois "Adicionar" no diálogo

---

### C) Criar funcionalidade para editar projeto (cabeçalho dos cartões)

Criar um novo componente `EditProjectDialog.tsx` que permita ao PM editar:
- Nome do projeto
- Descrição
- Status
- Gestor de Projeto
- Datas de início/fim

**Novos ficheiros**:
- `src/components/projects/EditProjectDialog.tsx`

**Alterações**:
- `src/pages/ProjetoDetalhe.tsx`: Adicionar botão de edição e integrar o diálogo
- `src/pages/Projetos.tsx`: Adicionar opção de edição rápida nos cartões

---

### D) Dashboard de estatísticas no topo de /projetos

Criar um novo hook e componentes para mostrar resumos agregados:

**Novo hook** `useProjectsAggregatedStats`:
- Total de orçamento planeado dos projetos ativos (status: planning, active, at_risk)
- Total de custos reais dos projetos concluídos (status: done)
- Total de receitas reais dos projetos concluídos
- Margem/Resultado dos projetos concluídos
- Número de projetos por status

**Novo componente** `ProjectsStatsCards.tsx`:
- Cartão "Orçamento em Curso" - soma dos custos planeados dos projetos ativos
- Cartão "Custos Fechados" - soma dos custos reais dos projetos concluídos
- Cartão "Receitas Fechadas" - soma das receitas reais dos projetos concluídos  
- Cartão "Resultado Fechados" - margem (receitas - custos) dos concluídos

---

## Estrutura de Ficheiros

```text
src/
├── components/projects/
│   ├── EditProjectDialog.tsx      [NOVO]
│   ├── ProjectsStatsCards.tsx     [NOVO]
│   └── EditTaskDialog.tsx         [CORRIGIR]
├── hooks/
│   └── useProjects.ts             [ALTERAR - adicionar hook agregado]
└── pages/
    ├── Projetos.tsx               [ALTERAR - adicionar stats + edição]
    └── ProjetoDetalhe.tsx         [ALTERAR - adicionar edição]
```

---

## Detalhes Técnicos

### Hook useProjectsAggregatedStats

```typescript
// Query que soma valores financeiros por status de projeto
export function useProjectsAggregatedStats(agencyId?: string) {
  return useQuery({
    queryKey: ['projects-aggregated-stats', agencyId],
    queryFn: async () => {
      // 1. Buscar todos os projetos da agência
      // 2. Para cada grupo (ativos vs concluídos):
      //    - Somar planned_cost de itens financeiros (projetos ativos)
      //    - Somar actual_cost e actual_revenue (projetos concluídos)
      // 3. Retornar objeto com totais
    },
    enabled: !!agencyId,
  });
}
```

### Cartões de Estatísticas

Usar o componente `StatCard` já existente para manter consistência visual com o dashboard principal.

Ícones sugeridos:
- Orçamento em Curso: `Wallet` ou `TrendingUp`
- Custos Fechados: `ArrowDownCircle`
- Receitas Fechadas: `ArrowUpCircle`
- Resultado: `Calculator` ou `BarChart3`

---

## Fluxo de Utilização

1. O utilizador acede a `/projetos`
2. No topo, vê 4 cartões com estatísticas agregadas
3. Nos cartões de projeto, pode clicar no ícone de edição (lápis) para editar rapidamente
4. Na página de detalhe, o PM pode:
   - Clicar em "Configurações" para editar o projeto
   - Clicar em "Membros" para gerir a equipa

