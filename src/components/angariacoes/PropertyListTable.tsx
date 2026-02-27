import { useNavigate } from 'react-router-dom';
import { DbProperty } from '@/hooks/useProperties';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Eye, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PropertyListTableProps {
  properties: DbProperty[];
  search: string;
}

const STAGE_LABELS: Record<string, string> = {
  documentos: 'Recolha Docs',
  avaliacao: 'Avaliação',
  publicacao: 'Publicação',
  visitas: 'Visitas',
  negociacao: 'Negociação',
};

const STAGE_COLORS: Record<string, string> = {
  documentos: 'bg-blue-100 text-blue-700',
  avaliacao: 'bg-purple-100 text-purple-700',
  publicacao: 'bg-teal-100 text-teal-700',
  visitas: 'bg-amber-100 text-amber-700',
  negociacao: 'bg-orange-100 text-orange-700',
};

const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  moradia: 'Moradia',
  terreno: 'Terreno',
  loja: 'Loja',
  escritorio: 'Escritório',
  armazem: 'Armazém',
  outro: 'Outro',
};

function ContractCountdown({ endDate }: { endDate: string | null }) {
  if (!endDate) return <span className="text-muted-foreground text-xs">—</span>;
  const days = differenceInDays(new Date(endDate), new Date());
  let color = 'text-emerald-600';
  if (days < 0) color = 'text-destructive font-semibold';
  else if (days <= 30) color = 'text-destructive';
  else if (days <= 60) color = 'text-amber-500';

  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{format(new Date(endDate), 'dd/MM/yyyy')}</span>
      <br />
      <span className={color}>
        {days < 0 ? `Expirado há ${Math.abs(days)}d` : `${days}d restantes`}
      </span>
    </div>
  );
}

function PortalIcons({ portals }: { portals?: { portal_name: string; is_published: boolean }[] }) {
  const names = ['Idealista', 'Imovirtual', 'Website'];
  return (
    <div className="flex gap-1">
      {names.map(name => {
        const found = portals?.find(p => p.portal_name.toLowerCase() === name.toLowerCase());
        const active = found?.is_published;
        return (
          <span
            key={name}
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
            title={name}
          >
            {name.substring(0, 3).toUpperCase()}
          </span>
        );
      })}
    </div>
  );
}

export function PropertyListTable({ properties, search }: PropertyListTableProps) {
  const navigate = useNavigate();

  const filtered = properties.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.reference.toLowerCase().includes(s) ||
      (p.address || '').toLowerCase().includes(s) ||
      (p.agent_name || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Referência</TableHead>
            <TableHead>Morada</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead>Agente</TableHead>
            <TableHead>Contrato</TableHead>
            <TableHead>Expiração</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Portais</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                Nenhuma angariação encontrada
              </TableCell>
            </TableRow>
          )}
          {filtered.map(p => (
            <TableRow
              key={p.id}
              className="cursor-pointer hover:bg-muted/50 group"
              onClick={() => navigate(`/angariacoes/${p.id}`)}
            >
              <TableCell>
                {p.cover_photo_url ? (
                  <img src={p.cover_photo_url} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium text-sm">{p.reference}</TableCell>
              <TableCell className="text-sm max-w-[200px] truncate">
                {p.address || '—'}
                {p.parish && <span className="text-muted-foreground"> · {p.parish}</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[p.property_type] || p.property_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-sm">
                {p.asking_price?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {(p.agent_name || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate max-w-[100px]">{p.agent_name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={`text-[10px] ${
                    p.contract_type === 'exclusive'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p.contract_type === 'exclusive' ? 'Exclusividade' : 'Não Exclusividade'}
                </Badge>
              </TableCell>
              <TableCell>
                <ContractCountdown endDate={p.contract_end_date} />
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] ${STAGE_COLORS[p.current_stage] || ''}`}>
                  {STAGE_LABELS[p.current_stage] || p.current_stage}
                </Badge>
              </TableCell>
              <TableCell>
                <PortalIcons portals={p.portals} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver Detalhe" onClick={e => { e.stopPropagation(); navigate(`/angariacoes/${p.id}`); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Nota">
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
