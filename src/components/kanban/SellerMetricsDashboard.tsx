import { Card, CardContent } from '@/components/ui/card';
import type { SellerCardLead } from './SellerKanbanCard';

interface Props {
  leads: SellerCardLead[];
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo && d <= now;
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function SellerMetricsDashboard({ leads }: Props) {
  const newThisWeek = leads.filter(l => l.columnId === 'novo' && isThisWeek(l.createdAt)).length;

  const avaliacoes = leads.filter(l => l.columnId === 'avaliacao').length;
  const apresentacoes = leads.filter(l => l.columnId === 'apresentacao').length;
  const angariacoes = leads.filter(l => ['angariacao', 'angariacao-reservada'].includes(l.columnId)).length;

  const avaliacoesPlusAngariacoes = leads.filter(l => ['avaliacao', 'apresentacao', 'negociacao', 'angariacao', 'angariacao-reservada'].includes(l.columnId)).length;
  const taxaConversao = avaliacoesPlusAngariacoes > 0 ? Math.round((angariacoes / avaliacoesPlusAngariacoes) * 100) : 0;

  const exclusivas = leads.filter(l => ['angariacao', 'angariacao-reservada'].includes(l.columnId) && l.sellerExclusivity === 'sim').length;
  const naoExclusivas = angariacoes - exclusivas;

  const semContacto7d = leads.filter(l => {
    if (!l.lastContactAt) return true;
    const days = Math.floor((Date.now() - new Date(l.lastContactAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 7;
  }).length;

  const metrics = [
    { label: 'Novas (semana)', value: newThisWeek, color: 'text-blue-600' },
    { label: 'Em Avaliação', value: avaliacoes, color: 'text-cyan-600' },
    { label: 'Apresentações', value: apresentacoes, color: 'text-amber-600' },
    { label: 'Angariações', value: angariacoes, color: 'text-green-600' },
    { label: 'Taxa Conversão', value: `${taxaConversao}%`, color: 'text-purple-600' },
    { label: 'Exclusivas', value: `${exclusivas}/${naoExclusivas}`, color: 'text-teal-600' },
    { label: '>7d sem contacto', value: semContacto7d, color: semContacto7d > 0 ? 'text-red-600' : 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {metrics.map(m => (
        <Card key={m.label} className="border">
          <CardContent className="p-3 text-center">
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-1">{m.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
