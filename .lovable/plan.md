

## Plano: Corrigir validação e submit do AddDealSheet

### Diagnóstico

Após análise do código, a validação na linha 56 parece correta sintaticamente. Os problemas prováveis são:

1. **`agencyId` é `null`** — o `useCreateDeal` lança "Sem agência" antes do insert, que é capturado no catch genérico. Se o utilizador não tem `user_agencies` activo, isto falha silenciosamente.

2. **Campos numéricos com valor "0"** — `!saleValue` é `true` quando `saleValue === "0"`, bloqueando o submit incorrectamente. O mesmo para `commissionPct`.

3. **Erro de ref no DateField** — warning "Function components cannot be given refs" do `PopoverTrigger asChild` a tentar passar ref ao `DateField`. Não bloqueia o submit mas pode causar comportamento inesperado.

### Alterações em `src/components/processos/AddDealSheet.tsx`

1. **Corrigir validação numérica** — mudar `!saleValue` para `saleValue === ''` e `!commissionPct` para `commissionPct === ''`, para aceitar "0" como valor válido.

2. **Melhorar feedback de erro** — mostrar toast com campos específicos em falta em vez de mensagem genérica.

3. **Tratar "Sem agência"** — adicionar validação prévia de `agencyId` com mensagem clara, e log no catch para debugging.

4. **Corrigir DateField ref warning** — não é bloqueante mas vamos corrigir para limpar os logs.

### Ficheiro a alterar

`src/components/processos/AddDealSheet.tsx` — função `handleSave` (linhas 55-86) e validação numérica.

