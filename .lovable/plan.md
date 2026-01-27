

## Objetivo

Reduzir o breakpoint de desktop de **1024px para 900px** para que a sidebar fique expandida em ecrãs médios.

---

## Alteração Necessária

### Ficheiro: `src/hooks/use-mobile.tsx`

Alterar apenas a constante `TABLET_BREAKPOINT`:

**Antes (linha 4):**
```typescript
const TABLET_BREAKPOINT = 1024;
```

**Depois:**
```typescript
const TABLET_BREAKPOINT = 900;
```

---

## Impacto da Alteração

Esta única mudança afeta automaticamente todos os hooks:

| Hook | Comportamento Anterior | Novo Comportamento |
|------|------------------------|-------------------|
| `useIsMobile()` | < 768px | < 768px (sem alteração) |
| `useIsTablet()` | 768px - 1023px | 768px - 899px |
| `useIsDesktop()` | ≥ 1024px | ≥ 900px |

---

## Resultado Final

| Dispositivo | Largura | Sidebar |
|-------------|---------|---------|
| Mobile | < 768px | Escondida |
| Tablet | 768px - 899px | Colapsada (só ícones) |
| Desktop | ≥ 900px | Expandida (ícones + texto) |

Desta forma, em ecrãs com 900px ou mais de largura, a sidebar ficará totalmente aberta com ícones e texto.

