

## Plano: Corrigir mapeamento de colunas na tab Consultores

### Problema
A coluna do Excel chama-se **"Agente"** mas o parser procura **"Utilizador"**. Resultado: `name` fica vazio e a linha é descartada pelo `.filter(r => r.name)`.

### Alterações em `src/pages/Importacao.tsx`

**1. `parseConsultorRows` (linha 598)** — Adicionar "Agente" como primeiro alias para `name`:
```typescript
name: get(row, 'Agente', 'agente', 'Utilizador', 'utilizador', 'name', 'nome'),
```

**2. Validação (linha 607)** — Aceitar linhas com pelo menos `name` E `nif`:
```typescript
.filter(r => r.name && r.nif);
```

**3. Tabela de mapeamento visual (linha 736)** — Atualizar o label de "Utilizador" para "Agente":
```
['Agente', 'name'],
```

Sem outras alterações necessárias — os restantes campos (`Agente NIF`, `Escalão`, etc.) já estão mapeados corretamente.

