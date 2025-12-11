import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanBoard, Column, Lead } from '@/components/kanban/KanbanBoard';

const recruitmentColumns: Column[] = [
  { id: 'new', title: 'Novo Contacto', color: 'blue' },
  { id: 'first-contact', title: 'Primeiro Contacto', color: 'cyan' },
  { id: 'interview-scheduled', title: 'Entrevista Agendada', color: 'yellow' },
  { id: 'interview-done', title: 'Entrevista Realizada', color: 'yellow' },
  { id: 'decision', title: 'Em Decisão / Proposta', color: 'yellow' },
  { id: 'training', title: 'Em Formação Inicial', color: 'cyan' },
  { id: 'active', title: 'Ativo na Equipa', color: 'green' },
  { id: 'rejected', title: 'Não Avançou', color: 'red' },
];

const sampleCandidates: Lead[] = [
  {
    id: '1',
    clientName: 'Miguel Correia',
    phone: '+351 912 999 111',
    email: 'miguel.correia@email.com',
    agentName: 'João Diretor',
    agency: 'Braga',
    source: 'LinkedIn',
    entryDate: '06/12/2024',
    columnId: 'new',
  },
  {
    id: '2',
    clientName: 'Sandra Vieira',
    phone: '+351 923 888 222',
    email: 'sandra.vieira@email.com',
    agentName: 'Maria Recrutadora',
    agency: 'Barcelos',
    source: 'Facebook Jobs',
    entryDate: '05/12/2024',
    columnId: 'first-contact',
  },
  {
    id: '3',
    clientName: 'David Moreira',
    phone: '+351 934 777 333',
    email: 'david.moreira@email.com',
    agentName: 'João Diretor',
    agency: 'Braga',
    source: 'Referência Interna',
    entryDate: '04/12/2024',
    columnId: 'interview-scheduled',
  },
  {
    id: '4',
    clientName: 'Catarina Matos',
    phone: '+351 945 666 444',
    email: 'catarina.matos@email.com',
    agentName: 'Maria Recrutadora',
    agency: 'Braga',
    source: 'Indeed',
    entryDate: '03/12/2024',
    columnId: 'interview-done',
  },
  {
    id: '5',
    clientName: 'Tiago Fernandes',
    phone: '+351 956 555 555',
    email: 'tiago.fernandes@email.com',
    agentName: 'João Diretor',
    agency: 'Barcelos',
    source: 'LinkedIn',
    entryDate: '02/12/2024',
    columnId: 'decision',
  },
  {
    id: '6',
    clientName: 'Mariana Costa',
    phone: '+351 967 444 666',
    email: 'mariana.costa@email.com',
    agentName: 'Maria Recrutadora',
    agency: 'Braga',
    source: 'Candidatura Espontânea',
    entryDate: '28/11/2024',
    columnId: 'training',
  },
  {
    id: '7',
    clientName: 'André Barbosa',
    phone: '+351 978 333 777',
    email: 'andre.barbosa@email.com',
    agentName: 'João Diretor',
    agency: 'Braga',
    source: 'Referência Interna',
    entryDate: '15/11/2024',
    columnId: 'active',
  },
];

export default function Recrutamento() {
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <KanbanBoard
          title="Recrutamento de Agentes"
          columns={recruitmentColumns}
          leads={sampleCandidates}
          onAddLead={() => console.log('Add new candidate')}
        />
      </div>
    </DashboardLayout>
  );
}
