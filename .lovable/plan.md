

## Plano: Sheet→Dialog + Tipologia multi-seleção

### 1. Sheet → Dialog (centrado no ecrã)

**Importações**: Substituir `Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription` por `Dialog, DialogContent` de `@/components/ui/dialog`.

**JSX wrapper** (linhas 273-275 e 688-689):
- `<Sheet open={open} onOpenChange={onOpenChange}>` → `<Dialog open={open} onOpenChange={onOpenChange}>`
- `<SheetContent className="...">` → `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">`
- Header: `<SheetHeader>` → `<div>`, `<SheetTitle>` → `<h2 className="text-lg font-semibold">`, `<SheetDescription>` → `<div>`
- Fechar tags correspondentes

### 2. Tipologia multi-seleção (tags)

**Estado** (useEffect, linha 135): `typology: lead.typology ? (Array.isArray(lead.typology) ? lead.typology : [lead.typology]) : []`

**UI** (linhas 377-390): Substituir o `<Select>` único por:
- Lista de badges com `×` para remover (igual às zonas)
- `<Select>` com opções: T0, T1, T2, T3, T4+, Moradia, Terreno, Comercial
- Ao selecionar, adiciona ao array se não existir

**handleSave** (linha 160): `typology: form.typology` (já é o array)

**Funções helper**: `addTypology(value)` e `removeTypology(idx)` — idênticas a `addZone`/`removeZone`.

### Ficheiro editado
- `src/components/kanban/BuyerDetailsSheet.tsx`

