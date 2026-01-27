
## Objetivo

Corrigir dois problemas de responsividade identificados na imagem:

1. **Números cortados nos cartões financeiros** - Os valores monetários nos cartões de resumo P&L estão truncados em ecrãs mais pequenos
2. **Sidebar não minimiza em tablet** - A barra lateral deveria colapsar automaticamente em tablets (768px-1024px) mas mantém-se aberta

---

## Análise dos Problemas

### Problema 1: Cartões P&L com números cortados

Nos cartões de "Receitas", "Custos" e "Resultado" do `ProjectBudgetTab.tsx`, o layout atual:
- Usa texto `text-2xl` para valores que podem ser longos (ex: "-110,00 €")
- Não ajusta o tamanho do texto em breakpoints menores
- Os cartões ficam demasiado apertados em tablets/ecrãs médios

### Problema 2: Sidebar em tablets

O hook `useIsMobile` apenas deteta ecrãs < 768px:
- Tablets (768px - 1024px) são tratados como "desktop"
- A sidebar mantém-se expandida (w-64) ocupando espaço precioso
- Deveria colapsar automaticamente em tablets e expandir apenas em desktop (> 1024px)

---

## Implementação

### A) Criar hook `useIsTablet` ou modificar `useIsMobile`

Adicionar deteção de tablet para permitir comportamento diferenciado:

```typescript
// src/hooks/use-mobile.tsx
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() { ... } // mantém < 768

export function useIsTablet() {
  // retorna true se 768 <= width < 1024
}

export function useIsDesktop() {
  // retorna true se width >= 1024
}
```

---

### B) Atualizar `DashboardLayout.tsx`

Modificar a lógica para colapsar sidebar automaticamente em tablets:

```typescript
const isMobile = useIsMobile();
const isTablet = useIsTablet(); // NOVO

useEffect(() => {
  if (isMobile) {
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  } else if (isTablet) {
    // Em tablet: sidebar visível mas colapsada
    setSidebarCollapsed(true);
  } else {
    // Em desktop: sidebar expandida
    setSidebarCollapsed(false);
  }
}, [isMobile, isTablet]);
```

---

### C) Melhorar responsividade dos cartões P&L em `ProjectBudgetTab.tsx`

Ajustar o layout dos cartões de resumo financeiro para ecrãs menores:

**Alterações no grid (linha 240)**:
```tsx
<div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
```

**Alterações nos valores (exemplos)**:
- Reduzir tamanho do texto em mobile/tablet
- Usar classes responsivas: `text-base md:text-lg lg:text-2xl`
- Permitir quebra de linha se necessário

**Exemplo de cartão ajustado**:
```tsx
<Card>
  <CardContent className="pt-4 md:pt-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Receitas</p>
        <div className="flex flex-col mt-1">
          <span className="text-xs text-muted-foreground">Previsto</span>
          <span className="text-sm md:text-lg font-semibold">{formatCurrency(...)}</span>
        </div>
      </div>
      <div className="text-left sm:text-right">
        <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500 opacity-50 hidden sm:block" />
        <span className="text-xs text-muted-foreground">Real</span>
        <span className="text-sm md:text-lg font-bold text-green-600">{formatCurrency(...)}</span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Ficheiros a Alterar

| Ficheiro | Alteração |
|----------|-----------|
| `src/hooks/use-mobile.tsx` | Adicionar `useIsTablet` e `useIsDesktop` |
| `src/components/layout/DashboardLayout.tsx` | Colapsar sidebar em tablet |
| `src/components/projects/ProjectBudgetTab.tsx` | Melhorar responsividade dos cartões P&L |

---

## Resultado Esperado

1. **Em Mobile (< 768px)**:
   - Sidebar escondida (abre com botão hamburger)
   - Cartões P&L empilhados verticalmente (2 por linha)
   - Texto ajustado para caber

2. **Em Tablet (768px - 1024px)**:
   - Sidebar visível mas colapsada (w-16, só ícones)
   - Cartões P&L em grelha 2x2
   - Texto com tamanho médio

3. **Em Desktop (> 1024px)**:
   - Sidebar expandida (w-64, ícones + texto)
   - Cartões P&L em grelha 1x4
   - Texto com tamanho completo
