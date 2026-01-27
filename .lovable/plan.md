

## Objetivo

Alterar o comportamento em **telemóvel (< 768px)** para mostrar a sidebar sempre visível mas colapsada (apenas ícones), em vez de a esconder completamente com menu hamburger.

**Nota:** PC e tablet permanecem exatamente como estão.

---

## Alterações Necessárias

### Ficheiro: `src/components/layout/DashboardLayout.tsx`

**1. Simplificar o useEffect (linhas 18-31):**

O mobile passa a ter o mesmo comportamento do tablet (sidebar colapsada):

```typescript
useEffect(() => {
  if (isDesktop) {
    // Desktop (≥ 900px): sidebar expandida
    setSidebarCollapsed(false);
  } else {
    // Mobile e Tablet: sidebar colapsada (só ícones)
    setSidebarCollapsed(true);
  }
}, [isMobile, isTablet, isDesktop]);
```

**2. Remover o overlay (linhas 49-56):**

Já não é necessário porque a sidebar fica sempre visível em mobile.

**3. Simplificar as props do Sidebar (linhas 59-65):**

```typescript
<Sidebar
  collapsed={sidebarCollapsed}
  onToggle={handleToggleSidebar}
/>
```

**4. Simplificar a TopBar (linhas 68-72):**

```typescript
<TopBar 
  sidebarCollapsed={sidebarCollapsed} 
  onMenuClick={handleToggleSidebar}
  showMenuButton={false}
/>
```

**5. Ajustar o padding do main (linha 78):**

```typescript
isMobile ? 'pl-16' : (sidebarCollapsed ? 'pl-16' : 'pl-64')
```

O mobile agora tem `pl-16` porque a sidebar colapsada tem largura `w-16`.

---

### Ficheiro: `src/components/layout/Sidebar.tsx`

**1. Remover a lógica de esconder em mobile (linhas 71-73):**

Remover este bloco que esconde a sidebar em mobile:
```typescript
if (isMobile && !isOpen) {
  return null;
}
```

**2. Simplificar a largura da sidebar (linhas 77-82):**

```typescript
className={cn(
  'fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 flex flex-col',
  collapsed ? 'w-16' : 'w-64'
)}
```

**3. Simplificar condições de texto (várias linhas):**

Onde está `(isMobile || !collapsed)` passa a ser apenas `!collapsed`.

---

## Resultado Final

| Dispositivo | Largura | Sidebar |
|-------------|---------|---------|
| Mobile | < 768px | Visível, colapsada (só ícones) |
| Tablet | 768px - 899px | Visível, colapsada (só ícones) |
| Desktop | ≥ 900px | Visível, expandida (ícones + texto) |

A experiência fica consistente em todos os dispositivos móveis/tablet, com a sidebar sempre visível mas compacta.

