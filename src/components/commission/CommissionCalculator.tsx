import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCommissionTable, useCommissionSplit, type CommissionTier } from '@/hooks/useAgencySettings';

interface Props {
  propertyValue: number;
  isExclusivity?: boolean;
  agencyId: string;
  onSelectCommission?: (percentage: number) => void;
}

function parseFee(fee: string, propertyValue: number): number {
  fee = fee.trim();
  if (fee.endsWith('%')) {
    return (parseFloat(fee) / 100) * propertyValue;
  }
  if (fee.endsWith('€')) {
    return parseFloat(fee.replace(/[^\d.,]/g, '').replace(',', '.'));
  }
  const num = parseFloat(fee.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (fee.includes('%')) return (num / 100) * propertyValue;
  return num;
}

function findTier(tiers: CommissionTier[], value: number): CommissionTier | null {
  for (const tier of tiers) {
    const from = tier.from;
    const to = tier.to ?? Infinity;
    if (value >= from && value <= to) return tier;
  }
  return null;
}

export function CommissionCalculator({ propertyValue, isExclusivity = true, agencyId, onSelectCommission }: Props) {
  const { data: tableSettings } = useCommissionTable(agencyId);
  const { data: splitSettings } = useCommissionSplit(agencyId);

  const [selectedOption, setSelectedOption] = useState<1 | 2>(1);
  const [customAgentSplit, setCustomAgentSplit] = useState(splitSettings.agentSplit);

  useEffect(() => {
    setCustomAgentSplit(splitSettings.agentSplit);
  }, [splitSettings.agentSplit]);

  const tier = useMemo(() => findTier(tableSettings.tiers, propertyValue), [tableSettings.tiers, propertyValue]);

  if (!tier || propertyValue <= 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Introduza um valor de imóvel válido para calcular a comissão.
      </div>
    );
  }

  const fee1 = parseFee(tier.fee1, propertyValue);
  const fee2 = parseFee(tier.fee2, propertyValue);
  const selectedFee = selectedOption === 1 ? fee1 : fee2;
  const vatAmount = selectedFee * 0.23;
  const agentAmount = selectedFee * (customAgentSplit / 100);
  const sellerAmount = selectedFee - agentAmount;
  const commissionPercentage = (selectedFee / propertyValue) * 100;

  return (
    <div className="space-y-4 p-1">
      <div className="text-xs text-muted-foreground">
        Valor do imóvel: <span className="font-semibold text-foreground">{propertyValue.toLocaleString('pt-PT')}€</span>
      </div>

      {/* Fee options toggle */}
      <div className="space-y-2">
        <Label className="text-xs">Honorário recomendado</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedOption === 1 ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => setSelectedOption(1)}
          >
            Opção 1: {fee1.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
            <Badge variant="secondary" className="ml-1 text-[10px]">{tier.fee1}</Badge>
          </Button>
          <Button
            variant={selectedOption === 2 ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
            onClick={() => setSelectedOption(2)}
          >
            Opção 2: {fee2.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
            <Badge variant="secondary" className="ml-1 text-[10px]">{tier.fee2}</Badge>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Split */}
      <div className="space-y-2">
        <Label className="text-xs">Divisão de comissão</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground">Angariador</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={customAgentSplit}
              onChange={e => setCustomAgentSplit(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="h-8 text-xs"
            />
          </div>
          <span className="text-muted-foreground mt-4">/</span>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-muted-foreground">Vendedor</span>
            <Input
              type="number"
              value={100 - customAgentSplit}
              disabled
              className="h-8 text-xs bg-muted"
            />
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Angariador: {agentAmount.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
          <span>Vendedor: {sellerAmount.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
        </div>
      </div>

      <Separator />

      {/* VAT */}
      <div className="text-xs space-y-1 bg-muted/50 p-2 rounded-md">
        <div className="flex justify-between">
          <span>Honorário (s/ IVA)</span>
          <span className="font-medium">{selectedFee.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>IVA (23%)</span>
          <span>+{vatAmount.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total c/ IVA</span>
          <span>{(selectedFee + vatAmount).toLocaleString('pt-PT', { maximumFractionDigits: 0 })}€</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Valores em regime de {isExclusivity ? 'exclusividade' : 'não exclusividade'}. Comissão: {commissionPercentage.toFixed(1)}%
      </p>

      {onSelectCommission && (
        <Button size="sm" className="w-full" onClick={() => onSelectCommission(parseFloat(commissionPercentage.toFixed(2)))}>
          Aplicar {commissionPercentage.toFixed(1)}% como comissão
        </Button>
      )}
    </div>
  );
}
