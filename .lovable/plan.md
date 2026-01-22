

# Plano de Correção: Botão "Criar Projeto"

## Contexto do Problema

O botão "Criar Projeto" não funciona porque existe uma inconsistência na validação:
- **Validação do botão**: Permite submeter se não há utilizadores na agência
- **Validação do `handleSubmit`**: Bloqueia silenciosamente se não há gestor selecionado

A agência actual ("Liberty Barcelos") não tem utilizadores associados, expondo este bug.

## Solução Proposta

Alinhar a lógica de validação: se não há gestor de projeto selecionado (e existem utilizadores), bloquear. Se não existem utilizadores, permitir criar o projeto sem PM (ou exigir seleccionar outra agência).

## Alterações a Efectuar

### 1. Corrigir `src/components/projects/AddProjectDialog.tsx`

**Opção A - Permitir projetos sem PM (recomendado para MVP)**

```typescript
// Linha 38 - Remover validação obrigatória de pmUserId
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!name || !agencyId) return;
  
  // pmUserId pode ser vazio se não há utilizadores
  createProject.mutate({
    agency_id: agencyId,
    name,
    description: description || undefined,
    status,
    pm_user_id: pmUserId || undefined, // Permitir undefined
    start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  }, {
    onSuccess: () => {
      onOpenChange(false);
      resetForm();
    },
  });
};
```

**Opção B - Bloquear sempre que não há PM**

```typescript
// Linha 67 - Alterar validação do botão
const isSubmitDisabled = createProject.isPending || !name || !pmUserId;

// Adicionar mensagem de aviso na UI quando não há utilizadores
```

### 2. Corrigir `src/hooks/useProjects.ts`

Actualizar a mutação para aceitar `pm_user_id` opcional:

```typescript
// Linha 149-169 - Ajustar para PM opcional
mutationFn: async (input: CreateProjectInput) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...input,
      pm_user_id: input.pm_user_id || user?.id, // Fallback para o utilizador actual
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Só adicionar membro PM se tiver pm_user_id
  if (input.pm_user_id) {
    await supabase
      .from('project_members')
      .insert({
        project_id: data.id,
        user_id: input.pm_user_id,
        role: 'pm',
      });
  }

  return data;
},
```

### 3. Verificar schema da base de dados

A coluna `pm_user_id` está definida como `NOT NULL`. Precisamos decidir:
- **Opção 1**: Manter NOT NULL e usar o utilizador actual como fallback
- **Opção 2**: Alterar para permitir NULL (requer migração)

**Recomendação**: Usar Opção 1 - fazer fallback para o utilizador logado se não houver PM selecionado.

### 4. Melhorar feedback ao utilizador

Adicionar toast de erro quando a validação falha (em vez de retorno silencioso):

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!name) {
    toast.error('O nome do projeto é obrigatório');
    return;
  }
  
  if (!agencyId) {
    toast.error('Erro: agência não identificada');
    return;
  }
  
  // Continuar com a criação...
};
```

## Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/projects/AddProjectDialog.tsx` | Corrigir validação e adicionar feedback |
| `src/hooks/useProjects.ts` | Ajustar mutação para PM opcional com fallback |
| `src/types/projects.ts` | Marcar `pm_user_id` como opcional no `CreateProjectInput` |

## Resultado Esperado

Após a correção:
- Se há utilizadores disponíveis e nenhum selecionado → Botão desativado
- Se não há utilizadores → Projeto criado com o utilizador actual como PM
- Mensagens de erro claras quando validação falha

