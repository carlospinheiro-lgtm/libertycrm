

## Plano: Melhorias em Consultores, DealDetailsSheet e AddDealSheet

### 1. Página Consultores (`src/pages/Consultores.tsx`)

**Formulário (Sheet):**
- Select "Sistema de Comissão" com 3 opções: RAPP, PURO, Trainee. Na abertura, mapear legacy values: `Alternativo` → `RAPP`, `Fixo` → `PURO`
- Toggle "Tem Empresa" visível apenas quando sistema = PURO, com nota "72.8% com empresa · 70% sem empresa"
- Toggle "Membro de Equipa" que guarda `is_team_member`. Quando ativado, force sistema para Trainee. Quando desativado, volta a RAPP
- Campo "Acumulado 12M" visível apenas para RAPP/Trainee, com nota sobre Maxwork
- Toggle "Confirmar valor" abaixo do acumulado, guarda `accumulated_12m_confirmed`. Auto-desativa quando o número muda. Mensagem verde "✓ Valor confirmado" ou âmbar "⚠ Confirmar valor manualmente"
- Linha de escalão calculado abaixo do acumulado (ex: "RAPP → 48%", "Trainee → 35%")
- Novos state vars: `isTeamMember`, `accumulated12mConfirmed`
- `handleSave` inclui `is_team_member` e `accumulated_12m_confirmed`

**Tabela:**
- Coluna "Sistema" com Badge colorido: azul RAPP, roxo PURO, laranja Trainee (mapear legacy)
- Coluna "Acumulado 12M" com ícone âmbar de aviso quando `accumulated_12m_confirmed !== true`
- Badge no header da página com contagem de consultores com acumulado por confirmar (apenas RAPP/Trainee ativos)

**Imports adicionais:** `AlertTriangle` de lucide-react, funções de `commissionCalc.ts` para calcular escalão

### 2. DealDetailsSheet (`src/components/processos/DealDetailsSheet.tsx`)

**Tab Financeiro — bloco de resumo read-only no topo:**
- Comissão Loja, Referência (se existir, com dedução), Comissão Consultor, Fica na Agência — usando valores já gravados no deal

**Tab Financeiro — secção Referência:**
- Toggle "Tem Referência". Quando ativo, dois campos: `referral_pct` e `referral_name`, inicializados do deal
- Estado `fin` expandido com `referral_pct`, `referral_name`

**Tab Financeiro — novos campos:**
- "Desconto Despesas (€)" editável → `expense_discount`
- "Líquido consultor" read-only = `consultant_commission - expense_discount`
- "Fica na Agência (€)" → `agency_net`
- "Comissão RE/MAX (€)" → `commission_remax`
- "Margem Comercial (€)" → `primary_margin`

**Tab CPCV:**
- Adicionar campos "Nome Comprador" (`buyer_name`) e "NIF Comprador" (`buyer_nif`)
- Expandir estado `cpcv` com estes campos, inicializados do deal

**Tab Resumo:**
- Campo "Lado" como Select com "100% Exclusivo" (value=1) e "50% Partilhado" (value=0.5), guardando em `side_fraction`
- Expandir estado `resumo` com `side_fraction`, inicializado do deal

**Imports adicionais:** `Switch` de `@/components/ui/switch`, `Select/SelectContent/SelectItem/SelectTrigger/SelectValue` de `@/components/ui/select`

### 3. AddDealSheet (`src/components/processos/AddDealSheet.tsx`)

**Secção campos opcionais:**
- Novo campo "Desconto Despesas (€)" que guarda `expense_discount`
- Nota pequena: "Este valor é deduzido da comissão do consultor nos Pagamentos"
- Novo state `expenseDiscount`, incluído no payload de save

### Ficheiros a editar
- `src/pages/Consultores.tsx`
- `src/components/processos/DealDetailsSheet.tsx`
- `src/components/processos/AddDealSheet.tsx`

