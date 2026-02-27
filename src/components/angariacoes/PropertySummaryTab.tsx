import { DbProperty } from '@/hooks/useProperties';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { differenceInDays, format } from 'date-fns';
import { RefreshCw } from 'lucide-react';

interface PropertySummaryTabProps {
  property: DbProperty;
  onRenewContract: () => void;
}

export function PropertySummaryTab({ property, onRenewContract }: PropertySummaryTabProps) {
  const daysRemaining = property.contract_end_date
    ? differenceInDays(new Date(property.contract_end_date), new Date())
    : null;

  const expiryColor = daysRemaining === null ? '' :
    daysRemaining < 0 ? 'text-destructive' :
    daysRemaining <= 30 ? 'text-destructive' :
    daysRemaining <= 60 ? 'text-amber-500' : 'text-emerald-600';

  const details = [
    { label: 'Tipo', value: property.property_type },
    { label: 'Morada', value: property.address || '—' },
    { label: 'Freguesia', value: property.parish || '—' },
    { label: 'Cidade', value: property.city || '—' },
    { label: 'Área (m²)', value: property.area_m2 || '—' },
    { label: 'Quartos', value: property.bedrooms || '—' },
    { label: 'WC', value: property.bathrooms || '—' },
    { label: 'Andar', value: property.floor || '—' },
    { label: 'Garagem', value: property.garage ? 'Sim' : 'Não' },
    { label: 'Cert. Energético', value: property.energy_certificate || '—' },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Detalhes do Imóvel</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {details.map(d => (
            <div key={d.label}>
              <span className="text-muted-foreground text-xs">{d.label}</span>
              <p className="font-medium">{String(d.value)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Preços</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Preço de Venda</span>
            <p className="font-bold text-lg">
              {property.asking_price?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Preço Mínimo</span>
            <p className="font-bold text-lg">
              {property.minimum_price
                ? property.minimum_price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                : '—'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Contrato</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Tipo</span>
            <p>
              <Badge className={property.contract_type === 'exclusive' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                {property.contract_type === 'exclusive' ? 'Exclusividade' : 'Não Exclusividade'}
              </Badge>
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Comissão</span>
            <p className="font-medium">{property.commission_percentage ? `${property.commission_percentage}%` : '—'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Início</span>
            <p className="font-medium">
              {property.contract_start_date ? format(new Date(property.contract_start_date), 'dd/MM/yyyy') : '—'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Fim</span>
            <p className={`font-medium ${expiryColor}`}>
              {property.contract_end_date ? format(new Date(property.contract_end_date), 'dd/MM/yyyy') : '—'}
              {daysRemaining !== null && (
                <span className="ml-1">
                  ({daysRemaining < 0 ? `Expirado há ${Math.abs(daysRemaining)}d` : `${daysRemaining}d`})
                </span>
              )}
            </p>
          </div>
        </div>

        {daysRemaining !== null && daysRemaining <= 30 && (
          <Button variant="outline" size="sm" onClick={onRenewContract} className="mt-2">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Renovar Contrato
          </Button>
        )}
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-semibold text-sm">Agente Atribuído</h3>
        <p className="text-sm">{property.agent_name || 'Sem agente'}</p>
      </Card>
    </div>
  );
}
