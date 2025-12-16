import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';

const sellerColumns: Column[] = [
  { id: 'new', title: 'Novo Proprietário', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'meeting', title: 'Reunião Captação', color: 'cyan' },
  { id: 'evaluation', title: 'Em Avaliação', color: 'yellow' },
  { id: 'proposal-sent', title: 'Proposta Enviada', color: 'yellow' },
  { id: 'decision', title: 'Em Decisão', color: 'yellow' },
  { id: 'signed', title: 'Angariação Assinada', color: 'green' },
  { id: 'lost', title: 'Perdido', color: 'red' },
];

const sampleLeads: Lead[] = [
  {
    id: '1',
    clientName: 'António Martins',
    phone: '+351 912 111 222',
    email: 'antonio.martins@email.com',
    agentName: 'Pedro Costa',
    agency: 'Braga',
    source: 'Contacto Direto',
    entryDate: '05/12/2024',
    notes: 'T3 em Braga Centro',
    columnId: 'new',
    temperature: 'warm',
  },
  {
    id: '2',
    clientName: 'Fernanda Gomes',
    phone: '+351 923 222 333',
    email: 'fernanda.gomes@email.com',
    agentName: 'Ana Lopes',
    agency: 'Barcelos',
    source: 'Referência Cliente',
    entryDate: '04/12/2024',
    notes: 'Moradia V4',
    columnId: 'first-contact',
    temperature: 'hot',
  },
  {
    id: '3',
    clientName: 'Rui Carvalho',
    phone: '+351 934 333 444',
    email: 'rui.carvalho@email.com',
    agentName: 'Sofia Almeida',
    agency: 'Braga',
    source: 'Facebook',
    entryDate: '03/12/2024',
    notes: 'Apartamento T2',
    columnId: 'meeting',
    temperature: 'cold',
  },
  {
    id: '4',
    clientName: 'Helena Pinto',
    phone: '+351 945 444 555',
    email: 'helena.pinto@email.com',
    agentName: 'Ricardo Santos',
    agency: 'Barcelos',
    source: 'Site RE/MAX',
    entryDate: '02/12/2024',
    notes: 'Quinta com terreno',
    columnId: 'evaluation',
    temperature: 'hot',
  },
  {
    id: '5',
    clientName: 'José Ribeiro',
    phone: '+351 956 555 666',
    email: 'jose.ribeiro@email.com',
    agentName: 'Pedro Costa',
    agency: 'Braga',
    source: 'Porta-a-porta',
    entryDate: '01/12/2024',
    notes: 'Loja comercial',
    columnId: 'proposal-sent',
    temperature: 'warm',
  },
  {
    id: '6',
    clientName: 'Carla Nunes',
    phone: '+351 967 666 777',
    email: 'carla.nunes@email.com',
    agentName: 'Ana Lopes',
    agency: 'Barcelos',
    source: 'Referência',
    entryDate: '30/11/2024',
    notes: 'Moradia geminada',
    columnId: 'decision',
    temperature: 'hot',
  },
  {
    id: '7',
    clientName: 'Paulo Teixeira',
    phone: '+351 978 777 888',
    email: 'paulo.teixeira@email.com',
    agentName: 'Sofia Almeida',
    agency: 'Braga',
    source: 'Campanha',
    entryDate: '28/11/2024',
    notes: 'T4 Duplex',
    columnId: 'signed',
    temperature: 'undefined',
  },
];

export default function LeadsVendedores() {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <KanbanBoard
          title="Leads Vendedores"
          columns={sellerColumns}
          leads={sampleLeads}
          onAddLead={() => console.log('Add new seller lead')}
        />
      </div>
    </DashboardLayout>
  );
}
