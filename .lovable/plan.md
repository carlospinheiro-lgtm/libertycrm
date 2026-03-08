

## Plano: 6 Melhorias no SellerDetailsSheet

### Resumo
Reescrever `src/components/kanban/SellerDetailsSheet.tsx` para alinhar com o `BuyerDetailsSheet.tsx`, aplicando as 6 melhorias pedidas.

### Alterações no ficheiro `src/components/kanban/SellerDetailsSheet.tsx`

#### 1. Sheet → Dialog centrado
- Substituir importações de `Sheet, SheetContent, SheetHeader, SheetTitle` por `Dialog, DialogContent` de `@/components/ui/dialog`
- `<Dialog open={open} onOpenChange={onOpenChange}>` + `<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">`

#### 2. Cabeçalho com avatar e botões de contacto
- Avatar circular com iniciais (`bg-primary`)
- Nome em destaque + `<Badge>Vendedor</Badge>` + badge origem se existir
- 3 botões: Ligar (azul `bg-primary/10`), Email (info `bg-info/10`), WhatsApp (verde `bg-success/10`) com links `tel:`, `mailto:`, `wa.me/`

#### 3. Temperatura como botões visuais
- Array `temperatureOptions` com 4 opções: 🔥 Quente (vermelho), ☀️ Morno (amarelo), ❄️ Frio (azul), ○ Indefinido (cinza)
- Botões com `cn()` que aplica cor quando activo
- Importar `Flame, Sun, Snowflake, Circle` do lucide-react

#### 4. Calendário visual na data da próxima ação
- Substituir `<Input type="date">` por `<Popover>` + `<Calendar>` do shadcn
- Botão mostra data formatada em PT com `format(date, 'PPP', { locale: pt })` ou "Data da ação" quando vazio
- Importar `Calendar`, `Popover`, `CalendarIcon`, `format`, `pt`

#### 5. Tipologia com múltipla seleção (tags)
- Novo campo `property_typology: string[]` no form state
- `useEffect` inicializa: `Array.isArray(lead.propertyTypology) ? lead.propertyTypology : lead.propertyTypology ? [lead.propertyTypology] : []`
- Select com opções: Apartamento T0, T1, T2, T3, T4+, Moradia, Terreno, Comercial
- Badges removíveis com `×` (padrão zonas)
- `handleSave` guarda `property_typology: form.property_typology`

#### 6. Histórico e Tarefas melhorados

**Histórico:**
- `interactionTypeConfig` com emojis: 📞 Chamada, 💬 WhatsApp, 📧 Email, 🤝 Reunião, 📝 Nota, ➡️ Mudança de etapa
- Data com `formatDistanceToNow(date, { addSuffix: true, locale: pt })`
- Badge traduzido para PT usando `interactionTypeConfig[type].label`
- Botão "+ Nota" que expande `Textarea` e guarda com `type: 'note'`
- Separar notas das interações de contacto

**Tarefas:**
- Input + botão "+" para criar tarefa rápida
- Botão `<Trash2>` para eliminar cada tarefa (usa `deleteTask`)
- Mensagem "Sem tarefas." quando vazio
- Secção "Visitas" separada com botão "+ Agendar visita" → campos data, hora, morada, notas → guarda em `lead_tasks` com título `"Visita: {morada}"`

### Importações adicionais
- `Dialog, DialogContent` de `@/components/ui/dialog`
- `Calendar` de `@/components/ui/calendar`
- `Popover, PopoverContent, PopoverTrigger` de `@/components/ui/popover`
- `Flame, Sun, Snowflake, Circle, CalendarIcon, Plus, X, Clock, MapPin` de `lucide-react`
- `format, formatDistanceToNow, isBefore, startOfDay` de `date-fns`
- `pt` de `date-fns/locale`
- `cn` de `@/lib/utils`

### Hooks
- `useLeadTasks` já importado — adicionar `deleteTask` à desestruturação
- `useSellerInteractions` já importado

### Ficheiro editado
- `src/components/kanban/SellerDetailsSheet.tsx` — reescrita completa

