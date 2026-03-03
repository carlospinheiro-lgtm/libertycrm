import { Card, CardContent } from '@/components/ui/card';
import type { RecruitmentCardLead } from './RecruitmentKanbanCard';

interface Props {
  leads: RecruitmentCardLead[];
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo && d <= now;
}

export function RecruitmentMetricsDashboard({ leads }: Props) {
  const newThisWeek = leads.filter(l => l.columnId === 'novo-lead' && isThisWeek(l.createdAt)).length;
  const entrevistasAgendadas = leads.filter(l => l.columnId === 'entrevista-agendada').length;
  const entrevistasRealizadas = leads.filter(l => l.columnId === 'entrevistado').length;
  const integrados = leads.filter(l => l.columnId === 'integrado').length;

  const entrevistaPlusIntegrado = leads.filter(l => ['entrevistado', 'em-decisao', 'integrado'].includes(l.columnId)).length;
  const taxaConversao = entrevistaPlusIntegrado > 0 ? Math.round((integrados / entrevistaPlusIntegrado) * 100) : 0;

  const semContacto7d = leads.filter(l => {
    if (l.columnId === 'nao-avancou' || l.columnId === 'integrado') return false;
    if (!l.lastContactAt) return true;
    const days = Math.floor((Date.now() - new Date(l.lastContactAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 7;
  }).length;

  const metrics = [
    { label: 'Novas (semana)', value: newThisWeek, color: 'text-blue-600' },
    { label: 'Entrevistas Agendadas', value: entrevistasAgendadas, color: 'text-cyan-600' },
    { label: 'Entrevistas Realizadas', value: entrevistasRealizadas, color: 'text-amber-600' },
    { label: 'Integrados', value: integrados, color: 'text-green-600' },
    { label: 'Taxa Conversão', value: `${taxaConversao}%`, color: 'text-purple-600' },
    { label: '>7d sem contacto', value: semContacto7d, color: semContacto7d > 0 ? 'text-red-600' : 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
