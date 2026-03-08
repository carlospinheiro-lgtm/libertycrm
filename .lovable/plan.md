

## Plano: Secção "Mover lead" no RecruitmentDetailsSheet

### Alterações em `src/components/kanban/RecruitmentDetailsSheet.tsx`

**Imports**: Adicionar `ArrowLeftRight` de lucide-react, `supabase` de `@/integrations/supabase/client`.

**Estado**: Adicionar `movePipeline` (default `'recruitment'`) e `moveStage` (default `''`).

**Dados estáticos**: Definir `pipelineStages` com 3 chaves:
- `recruitment`: 7 etapas do recrutamento (novo-lead, contactado, etc.)
- `buyer`: 8 etapas dos compradores (novo, contacto-feito, etc.)
- `seller`: 8 etapas dos vendedores (novo, contacto-feito, avaliacao, etc.)

**Handler `handleMoveLead`**:
- Se `movePipeline === 'recruitment'`: chama `onSave(lead.id, { column_id: moveStage })` + toast "Lead movida para [etapa]"
- Se `buyer` ou `seller`: insere novo registo em `leads` via supabase com `lead_type: 'buyer'|'seller'`, copiando `client_name`, `phone`, `email`, `agency_id`, `user_id`, `column_id` + toast "✅ Candidato duplicado para [pipeline]"

**UI**: Após o CV e antes dos botões Guardar/Eliminar:
- `<Separator>`
- Título com `ArrowLeftRight` + "Mover lead"
- Select "Pipeline" com 3 opções
- Select "Etapa" dinâmico baseado no pipeline selecionado
- Botão "Mover" com ícone `ArrowLeftRight`
- Texto informativo em `text-xs text-muted-foreground`

Reset `moveStage` quando `movePipeline` muda.

### Ficheiros editados
- `src/components/kanban/RecruitmentDetailsSheet.tsx`

