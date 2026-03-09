

## Plano: Seletor de agência na página de Importação

### Problema
A página usa sempre `currentUser.agencyId`, sem permitir escolher outra agência.

### Alterações em `src/pages/Importacao.tsx`

**1. Importar hooks e componentes necessários**
- Importar `useActiveAgencies` de `@/hooks/useAgencies`
- Importar `Building2` do lucide-react

**2. Refactorizar o componente `Importacao`** (linhas 936-982)

- Adicionar state `selectedAgencyId` inicializado com `currentUser?.agencyId`
- Adicionar state `tabKey` (counter) para forçar reset dos tabs ao mudar agência
- Chamar `useActiveAgencies()` para obter lista de agências
- Renderizar grupo de botões (um por agência) acima dos tabs, com estilo visual de botão ativo/inativo
- Ao clicar numa agência diferente: atualizar `selectedAgencyId`, incrementar `tabKey` (força remount dos tabs, limpando ficheiros)
- Usar `selectedAgencyId` em vez de `agencyId` fixo para passar aos tabs
- Enquanto `selectedAgencyId` estiver vazio, mostrar mensagem de bloqueio em vez dos tabs

**3. Estrutura visual**

```text
┌─────────────────────────────────────────┐
│ Header: Importação Maxwork              │
├─────────────────────────────────────────┤
│ Agência: [Btn A] [Btn B] [Btn C]  ← novo │
├─────────────────────────────────────────┤
│ Tabs: Processos | Consultores | Equipas │
│ ...conteúdo...                          │
└─────────────────────────────────────────┘
```

### Ficheiro
- `src/pages/Importacao.tsx` — ~20 linhas alteradas/adicionadas no bloco do componente principal

