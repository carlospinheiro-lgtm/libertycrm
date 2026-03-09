

## Plano: Sistema de Comissões RE/MAX

### 1. Migração de base de dados

**Tabela `deals`** — adicionar 4 campos:
- `referral_pct` numeric default 0
- `referral_name` text
- `referral_amount` numeric
- `agency_net` numeric

**Tabela `consultants`** — adicionar 2 campos:
- `accumulated_12m_confirmed` boolean default false
- `is_team_member` boolean default false

**Migração de dados:**
- `UPDATE consultants SET is_team_member = true WHERE team_leader IS NOT NULL AND team_leader != ''`
- `UPDATE consultants SET commission_system = 'RAPP' WHERE commission_system = 'Alternativo'`
- `UPDATE consultants SET commission_system = 'PURO' WHERE commission_system = 'Fixo'`

### 2. Criar `src/lib/commissionCalc.ts`

Funções puras, sem dependências externas.

```text
Input: saleValue, commissionPct, sideFraction, referralPct,
       consultant: { commission_system, has_company, accumulated_12m, is_team_member }

Cascata:
  L1: totalCommission = saleValue * commissionPct / 100
  L2: agencySide = totalCommission * sideFraction
      referralAmount = agencySide * referralPct / 100
      agencyAfterReferral = agencySide - referralAmount
  L3: Determinar sistema (is_team_member → Trainee, else commission_system || 'RAPP')
      Determinar percentagem efetiva por escalão:
        RAPP:    <25k→40%, <50k→48%, ≥50k→50%
        PURO:    has_company→72.8%, else→70%
        Trainee: <25k→30%, <50k→35%, ≥50k→40%
  L4: agentAmount = agencyAfterReferral * effectivePct / 100
      agencyNet = agencyAfterReferral - agentAmount

Output: { totalCommission, agencySide, referralAmount, agencyAfterReferral,
          systemLabel, effectivePct, agentAmount, agencyNet }
```

### 3. Atualizar `src/hooks/useConsultants.ts`

Expandir a interface e o select para incluir `commission_system`, `has_company`, `accumulated_12m`, `is_team_member`, `accumulated_12m_confirmed`.

### 4. Reformular `src/components/processos/AddDealSheet.tsx`

- Substituir query inline por `useConsultants()`
- Adicionar state: `sideFraction` (select 0.5/1), `hasReferral` (toggle), `referralPct` (default 25), `referralName`
- Ao selecionar consultor, guardar objeto completo para cálculo
- Usar `calculateCommission()` em `useMemo` para preview em tempo real
- Renderizar caixa de preview com todos os valores intermédios e label do sistema (ex: "RAPP 48%")
- Se sistema RAPP/Trainee e `accumulated_12m_confirmed !== true`, mostrar alerta e desabilitar botão guardar
- No `handleSave`, gravar: `commission_store`, `consultant_commission`, `agency_net`, `referral_pct`, `referral_name`, `referral_amount`, `side_fraction`

### 5. Atualizar `src/pages/Pagamentos.tsx`

- Expandir `ConsultantInfo` com `commission_system`, `has_company`, `accumulated_12m`, `is_team_member`
- Alterar `getCommission(d, consultantMap)`:
  1. Se `d.consultant_commission > 0` → usar (deals Maxwork)
  2. Se tem `sale_value`, `commission_pct` e consultor no mapa → `calculateCommission()`
  3. Fallback: `commission_store * 0.47`

### 6. Atualizar `src/hooks/useDeals.ts`

Adicionar os 4 novos campos à interface `Deal`.

### Ficheiros
- **Migração SQL** (1 migration)
- **Criar:** `src/lib/commissionCalc.ts`
- **Editar:** `src/hooks/useConsultants.ts`, `src/hooks/useDeals.ts`, `src/components/processos/AddDealSheet.tsx`, `src/pages/Pagamentos.tsx`

