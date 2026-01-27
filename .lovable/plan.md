

## Objetivo

Corrigir a sidebar para que fique **totalmente aberta (expandida)** em desktop (> 1024px), mantendo o comportamento colapsado em tablet e telemóvel.

---

## Análise do Problema

O código atual no `DashboardLayout.tsx` está correto em teoria:

```typescript
if (isMobile) {
  setSidebarCollapsed(true);
} else if (isTablet) {
  setSidebarCollapsed(true);
} else {
  setSidebarCollapsed(false); // Desktop - deveria expandir
}
```

**Problema identificado**: O estado inicial de `sidebarCollapsed` é `useState(false)`, mas durante a hidratação inicial:
- Os hooks `useIsMobile` e `useIsTablet` retornam `undefined` convertido para `false`
- O `useEffect` corre com esses valores iniciais
- Se houver qualquer inconsistência na deteção, a sidebar pode ficar no estado errado

**Solução**: Usar o hook `useIsDesktop` diretamente para uma deteção mais explícita e robusta do estado desktop.

---

## Alterações Necessárias

### Ficheiro: `src/components/layout/DashboardLayout.tsx`

**1. Importar `useIsDesktop`:**
```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-mobile';
```

**2. Usar o hook no componente:**
```typescript
const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop(); // NOVO
```

**3. Reescrever o useEffect com lógica mais explícita:**
```typescript
useEffect(() => {
  if (isDesktop) {
    // Desktop (> 1024px): sidebar expandida
    setSidebarCollapsed(false);
  } else if (isMobile) {
    // Mobile (< 768px): sidebar escondida por defeito
    setSidebarOpen(false);
    setSidebarCollapsed(true);
  } else {
    // Tablet (768px - 1024px): sidebar colapsada (só ícones)
    setSidebarCollapsed(true);
  }
}, [isMobile, isTablet, isDesktop]);
```

**Nota importante**: A ordem das condições agora prioriza `isDesktop` primeiro, garantindo que em ecrãs grandes a sidebar fica sempre expandida.

---

## Resultado Esperado

| Dispositivo | Largura | Sidebar |
|-------------|---------|---------|
| Mobile | < 768px | Escondida (abre com hamburger) |
| Tablet | 768px - 1024px | Visível, colapsada (só ícones) |
| Desktop | > 1024px | Visível, expandida (ícones + texto) |

