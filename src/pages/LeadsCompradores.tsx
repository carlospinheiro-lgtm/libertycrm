import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';

const buyerColumns: Column[] = [
  { id: 'new', title: 'Novo Contacto', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'qualifying', title: 'Em Qualificação', color: 'cyan' },
  { id: 'visits', title: 'Visitas Agendadas', color: 'yellow' },
  { id: 'proposal', title: 'Proposta Apresentada', color: 'yellow' },
  { id: 'negotiation', title: 'Em Negociação', color: 'yellow' },
  { id: 'won', title: 'Fechado - Ganhámos', color: 'green' },
  { id: 'lost', title: 'Fechado - Perdemos', color: 'red' },
];

const sampleLeads: Lead[] = [
  {
    id: '1',
    clientName: 'Maria Santos',
    phone: '+351 912 345 678',
    email: 'maria.santos@email.com',
    agentName: 'Pedro Costa',
    agentId: 'agent-1',
    agency: 'Braga',
    source: 'Portal Imobiliário',
    entryDate: '05/12/2024',
    columnId: 'new',
    temperature: 'hot',
  },
  {
    id: '2',
    clientName: 'João Ferreira',
    phone: '+351 923 456 789',
    email: 'joao.ferreira@email.com',
    agentName: 'Ana Lopes',
    agency: 'Barcelos',
    source: 'Referência',
    entryDate: '04/12/2024',
    columnId: 'new',
    temperature: 'warm',
  },
  {
    id: '3',
    clientName: 'Ana Oliveira',
    phone: '+351 934 567 890',
    email: 'ana.oliveira@email.com',
    agentName: 'Pedro Costa',
    agency: 'Braga',
    source: 'Facebook',
    entryDate: '03/12/2024',
    columnId: 'first-contact',
    temperature: 'cold',
  },
  {
    id: '4',
    clientName: 'Carlos Mendes',
    phone: '+351 945 678 901',
    email: 'carlos.mendes@email.com',
    agentName: 'Sofia Almeida',
    agency: 'Braga',
    source: 'Site RE/MAX',
    entryDate: '02/12/2024',
    columnId: 'qualifying',
    temperature: 'hot',
  },
  {
    id: '5',
    clientName: 'Rita Sousa',
    phone: '+351 956 789 012',
    email: 'rita.sousa@email.com',
    agentName: 'Ana Lopes',
    agency: 'Barcelos',
    source: 'Campanha Google',
    entryDate: '01/12/2024',
    columnId: 'visits',
    temperature: 'warm',
  },
  {
    id: '6',
    clientName: 'Bruno Pereira',
    phone: '+351 967 890 123',
    email: 'bruno.pereira@email.com',
    agentName: 'Ricardo Santos',
    agency: 'Braga',
    source: 'Portal Imobiliário',
    entryDate: '30/11/2024',
    columnId: 'proposal',
    temperature: 'hot',
  },
  {
    id: '7',
    clientName: 'Inês Rodrigues',
    phone: '+351 978 901 234',
    email: 'ines.rodrigues@email.com',
    agentName: 'Sofia Almeida',
    agency: 'Barcelos',
    source: 'Referência',
    entryDate: '28/11/2024',
    columnId: 'negotiation',
    temperature: 'hot',
  },
  {
    id: '8',
    clientName: 'Manuel Silva',
    phone: '+351 989 012 345',
    email: 'manuel.silva@email.com',
    agentName: 'Pedro Costa',
    agency: 'Braga',
    source: 'Facebook',
    entryDate: '25/11/2024',
    columnId: 'won',
    temperature: 'undefined',
  },
];

export default function LeadsCompradores() {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <KanbanBoard
          title="Leads Compradores"
          columns={buyerColumns}
          leads={sampleLeads}
        />
      </div>
    </DashboardLayout>
  );
}
