

## Plano: Adicionar secção "Mover lead" ao SellerDetailsSheet

### Alterações em `src/components/kanban/SellerDetailsSheet.tsx`

#### 1. Imports adicionais
- Adicionar `ArrowRightLeft`, `Copy` ao import de lucide-react
- Adicionar `supabase` de `@/integrations/supabase/client`

#### 2. Constantes de pipeline (como no BuyerDetailsSheet)
```typescript
const buyerPipelineColumns = [
  { id: 'novo', title: 'Novo' },
  { id: 'contacto-feito', title: 'Contacto Feito' },
  { id: 'qualificacao', title: 'Qualificação' },
  { id: 'ativo', title: 'Ativo (Imóveis enviados)' },
  { id: 'visitas', title: 'Visitas' },
  { id: 'proposta-negociacao', title: 'Proposta / Negociação' },
  { id: 'reserva-cpcv', title: 'Reserva / CPCV' },
  { id: 'perdido-followup', title: 'Perdido / Follow-up' },
];
const sellerPipelineColumns = [
  { id: 'novo', title: 'Novo' },
  // ... 8 etapas vendedores
];
```

#### 3. Novos estados
- `movePipeline` (default `'vendedores'`)
- `moveColumnId` (default `''`)
- Reset no `useEffect` quando lead muda

#### 4. Handlers
- `handleMoveLead`: Se vendedores → `onSave(id, { column_id })` + toast. Se compradores → insert direto via supabase (`lead_type: 'buyer'`, copiando dados do contacto) + toast.
- `handleDuplicateToBuyers`: Insert via supabase com `lead_type: 'buyer'` + toast.

#### 5. UI — Após a secção "Informação Comercial" (linha ~431), antes dos botões Guardar/Eliminar (linha ~433)
- `<Separator />`
- Bloco com `bg-muted/30`, ícone `ArrowRightLeft`, título "Mover lead"
- 2 dropdowns: Pipeline (Vendedores/Compradores) e Etapa (dinâmica)
- Botão "Mover" + Botão condicional "Duplicar para CRM Compradores" (quando pipeline = compradores)
- Texto explicativo abaixo do botão duplicar

### Ficheiro editado
- `src/components/kanban/SellerDetailsSheet.tsx`

