import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { Agency } from '@/hooks/useAgencies';

interface ImportAgencySelectorProps {
  agencies: Agency[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  isLoading?: boolean;
}

export function ImportAgencySelector({
  agencies,
  selectedId,
  onSelect,
  isLoading,
}: ImportAgencySelectorProps) {
  if (isLoading) {
    return <Skeleton className="h-10 w-full max-w-sm" />;
  }

  return (
    <Select 
      value={selectedId || undefined} 
      onValueChange={(value) => onSelect(value)}
    >
      <SelectTrigger className="w-full max-w-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Selecionar agência..." />
        </div>
      </SelectTrigger>
      <SelectContent>
        {agencies.map((agency) => (
          <SelectItem key={agency.id} value={agency.id}>
            <div className="flex items-center gap-2">
              <span>{agency.name}</span>
              {agency.remax_code && (
                <span className="text-xs text-muted-foreground">
                  ({agency.remax_code})
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
