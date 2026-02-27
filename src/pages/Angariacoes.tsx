import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PropertySummaryBar } from '@/components/angariacoes/PropertySummaryBar';
import { PropertyListTable } from '@/components/angariacoes/PropertyListTable';
import { useProperties } from '@/hooks/useProperties';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Angariacoes() {
  const { properties, isLoading } = useProperties();
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Angariações</h1>
              <p className="text-sm text-muted-foreground">Imóveis sob contrato de mediação</p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por ref., morada, agente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <>
            <PropertySummaryBar properties={properties} />
            <PropertyListTable properties={properties} search={search} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
