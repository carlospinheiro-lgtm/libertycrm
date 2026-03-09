

## Plano: Converter Honorários % de decimal para percentagem

### Problema
O Excel tem `0.40` (formato decimal) mas `parseNum` guarda diretamente como `0.40`, resultando em "0.4%" na UI em vez de "40%".

### Alteração em `src/pages/Importacao.tsx`

Na linha ~604, após o `parseNum`, multiplicar por 100 se o valor for ≤ 1:

```typescript
commission_pct: (() => {
  const raw = parseNum(get(row, 'Honorários %', 'honorarios_%', 'honorarios', 'commission_pct'));
  return raw !== null && raw > 0 && raw <= 1 ? Math.round(raw * 10000) / 100 : raw;
})(),
```

Lógica: se `0 < valor ≤ 1`, assume formato decimal e multiplica por 100. Valores já em percentagem (e.g. `40`) ficam inalterados.

### Ficheiro
- `src/pages/Importacao.tsx` — 1 linha alterada

