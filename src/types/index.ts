// Client Entity
export interface Client {
  id: string;
  name: string;
  nif: string;
  phone: string;
  email: string;
  address: string;
  clientTypes: ('buyer' | 'seller')[];
  agencies: ('braga' | 'barcelos')[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Temperature for leads
export type LeadTemperature = 'hot' | 'warm' | 'cold' | 'undefined';

// ============= SOURCE / ORIGIN TYPES =============
export type SourceFlow = 'vendedores' | 'compradores' | 'ambos';
export type SourceCategory = 'posicionamento' | 'marketing' | 'referencias' | 'espontaneo';

export interface Source {
  id: string;
  name: string;
  flow: SourceFlow;
  category: SourceCategory;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// Default sources mock data
export const defaultSources: Source[] = [
  // Posicionamento
  { id: '1', name: 'Entrou na Loja', flow: 'ambos', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '2', name: 'Posicionamento', flow: 'vendedores', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '3', name: 'Porta-a-Porta', flow: 'vendedores', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Marketing
  { id: '4', name: 'Portal Imobiliário', flow: 'compradores', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '5', name: 'Facebook', flow: 'ambos', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '6', name: 'Instagram', flow: 'ambos', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '7', name: 'Google Ads', flow: 'ambos', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '8', name: 'Website', flow: 'ambos', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Referências
  { id: '9', name: 'Referência Cliente', flow: 'ambos', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '10', name: 'Referência Parceiro', flow: 'ambos', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Espontâneo
  { id: '11', name: 'Contacto Direto', flow: 'ambos', category: 'espontaneo', isActive: true, createdAt: new Date(), createdBy: 'system' },
];

// ============= LEAD TYPES =============
export interface BuyerLead {
  id: string;
  clientId: string;
  client?: Client;
  agency: 'braga' | 'barcelos';
  agentId: string;
  agentName: string;
  sourceId: string;
  source: string;
  sourceCategory: SourceCategory;
  entryDate: Date;
  status: string;
  notes: string;
  columnId: string;
  temperature: LeadTemperature;
  nextActivityDate?: string;
  nextActivityDescription?: string;
}

export interface SellerLead {
  id: string;
  clientId: string;
  client?: Client;
  agency: 'braga' | 'barcelos';
  agentId: string;
  agentName: string;
  propertyRef: string;
  propertyType: string;
  estimatedValue: number;
  sourceId: string;
  source: string;
  sourceCategory: SourceCategory;
  entryDate: Date;
  status: string;
  notes: string;
  columnId: string;
  temperature: LeadTemperature;
  nextActivityDate?: string;
  nextActivityDescription?: string;
}

// Kanban Column
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
}

// Calendar Activity
export interface CalendarActivity {
  id: string;
  leadId: string;
  title: string;
  description: string;
  date: string;
  googleEventId?: string;
  createdAt: Date;
}

// User Profile
export type UserRole = 'admin' | 'director' | 'agent' | 'recruiter' | 'process_staff' | 'admin_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency: 'braga' | 'barcelos' | 'both';
  avatar?: string;
}

// Dashboard Stats
export interface DashboardStats {
  buyerLeads: number;
  sellerLeads: number;
  activeProcesses: number;
  recruitmentCandidates: number;
  monthlyRevenue: number;
  pendingActivities: number;
}

// Recruitment Candidate
export interface RecruitmentCandidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  agency: 'braga' | 'barcelos';
  recruiterId: string;
  recruiterName: string;
  firstContactDate: Date;
  interviewDate?: Date;
  entryDate?: Date;
  notes: string;
  columnId: string;
  temperature: LeadTemperature;
  nextActivityDate?: string;
  nextActivityDescription?: string;
}

// Process / Credit
export interface Process {
  id: string;
  processNumber: string;
  type: 'sale_no_credit' | 'sale_with_credit' | 'sale_credit_intermediation';
  buyerClientId: string;
  sellerClientId: string;
  propertyRef: string;
  agency: 'braga' | 'barcelos';
  buyerAgentId: string;
  sellerAgentId: string;
  processManagerId: string;
  creditManagerId?: string;
  proposalAcceptedDate?: Date;
  cpcvDate?: Date;
  deedDate?: Date;
  notes: string;
  columnId: string;
}

// Activity
export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'training' | 'team_event' | 'marketing' | 'other';
  agency: 'braga' | 'barcelos' | 'both';
  startDate: Date;
  endDate: Date;
  responsibleId: string;
  responsibleName: string;
}

// Account Entry
export interface AccountEntry {
  id: string;
  agentId: string;
  date: Date;
  type: 'revenue' | 'expense';
  category: 'commission' | 'advertising' | 'training' | 'fees' | 'other';
  description: string;
  amount: number;
  agency: 'braga' | 'barcelos';
  reference?: string;
}

// ============= OBJECTIVE TYPES =============
export type ObjectiveFlow = 'vendedores' | 'compradores' | 'geral';

export type ActivityObjectiveType = 
  // Vendedores
  | 'posicionamento_vendedores'
  | 'leads_vendedores'
  | 'chamadas_vendedores'
  | 'contactos_efetivos_vendedores'
  | 'apresentacoes_servicos'
  | 'seguimentos_vendedores'
  // Compradores
  | 'posicionamento_compradores'
  | 'leads_compradores'
  | 'qualificacao'
  | 'visitas'
  | 'propostas';

export type ResultObjectiveType =
  | 'angariacao_reservada'
  | 'reserva_comprador'
  | 'transacao_venda'
  | 'transacao_arrendamento';

export interface Objective {
  id: string;
  name: string;
  flow: ObjectiveFlow;
  objectiveType: 'activity' | 'result';
  activityType?: ActivityObjectiveType;
  resultType?: ResultObjectiveType;
  currentValue: number;
  targetValue: number;
  unit: string;
  type: 'currency' | 'number' | 'points' | 'percentage';
  startDate?: Date;
  endDate?: Date;
  targetType?: 'agency' | 'director' | 'agent';
  targetId?: string;
  targetName?: string;
  sourceFilter?: 'all' | string[];
}

// Objective Update
export interface ObjectiveUpdate {
  id: string;
  objectiveId: string;
  objectiveName: string;
  type: 'angariacao' | 'reserva' | 'pontos' | 'lead' | 'transacao' | 'outro';
  description: string;
  value: string;
  numericValue: number;
  notes?: string;
  createdAt: Date;
}

// ============= TRANSACTION TYPES =============
export type TransactionType = 'venda' | 'arrendamento';
export type TransactionStatus = 'pendente' | 'cpcv_assinado' | 'cpcv_condicionado' | 'cpcv_descondicionado' | 'escritura';

export interface Transaction {
  id: string;
  processId: string;
  type: TransactionType;
  status: TransactionStatus;
  value: number;
  
  // Datas importantes
  cpcvDate?: Date;
  descondicionamentoDate?: Date;
  escrituraDate?: Date;
  
  // Validação
  validatedBy?: string;
  validatedAt?: Date;
  isValidated: boolean;
  
  // Origem herdada
  buyerLeadId: string;
  sellerLeadId: string;
  buyerSourceId: string;
  sellerSourceId: string;
  
  // Agentes
  buyerAgentId: string;
  sellerAgentId: string;
  
  agency: 'braga' | 'barcelos';
}

// Category labels for display
export const sourceCategoryLabels: Record<SourceCategory, string> = {
  posicionamento: 'Posicionamento',
  marketing: 'Marketing',
  referencias: 'Referências',
  espontaneo: 'Espontâneo',
};

export const sourceFlowLabels: Record<SourceFlow, string> = {
  vendedores: 'Vendedores',
  compradores: 'Compradores',
  ambos: 'Ambos',
};

export const objectiveFlowLabels: Record<ObjectiveFlow, string> = {
  vendedores: 'Vendedores',
  compradores: 'Compradores',
  geral: 'Geral',
};
