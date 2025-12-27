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
export type SourceFlow = 'vendedores' | 'compradores' | 'recrutamento' | 'intermediacao_credito' | 'ambos';
export type SourceType = 'ativa' | 'passiva';
export type SourceCategory = 'posicionamento' | 'marketing' | 'referencias' | 'espontaneo';

export interface Source {
  id: string;
  name: string;
  flow: SourceFlow;
  sourceType: SourceType;
  category: SourceCategory;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// Default sources mock data
export const defaultSources: Source[] = [
  // Posicionamento - ATIVA
  { id: '1', name: 'Posicionamento', flow: 'vendedores', sourceType: 'ativa', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '2', name: 'Porta-a-Porta', flow: 'vendedores', sourceType: 'ativa', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '3', name: 'Entrou na Loja', flow: 'ambos', sourceType: 'passiva', category: 'posicionamento', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Marketing - PASSIVA
  { id: '4', name: 'Portal Imobiliário', flow: 'compradores', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '5', name: 'Facebook', flow: 'ambos', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '6', name: 'Instagram', flow: 'ambos', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '7', name: 'Google Ads', flow: 'ambos', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '8', name: 'Website', flow: 'ambos', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Referências - PASSIVA
  { id: '9', name: 'Referência Cliente', flow: 'ambos', sourceType: 'passiva', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '10', name: 'Referência Parceiro', flow: 'ambos', sourceType: 'passiva', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Espontâneo - ATIVA
  { id: '11', name: 'Contacto Direto', flow: 'ambos', sourceType: 'ativa', category: 'espontaneo', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '12', name: 'Prospecção Telefónica', flow: 'ambos', sourceType: 'ativa', category: 'espontaneo', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Recrutamento específicas
  { id: '13', name: 'LinkedIn Recruiting', flow: 'recrutamento', sourceType: 'ativa', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '14', name: 'Candidatura Website', flow: 'recrutamento', sourceType: 'passiva', category: 'marketing', isActive: true, createdAt: new Date(), createdBy: 'system' },
  
  // Intermediação de Crédito específicas
  { id: '15', name: 'Pedido via Processo', flow: 'intermediacao_credito', sourceType: 'passiva', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
  { id: '16', name: 'Contacto Banco Parceiro', flow: 'intermediacao_credito', sourceType: 'passiva', category: 'referencias', isActive: true, createdAt: new Date(), createdBy: 'system' },
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
export type ObjectiveFlow = 'vendedores' | 'compradores' | 'recrutamento' | 'intermediacao_credito' | 'geral';
export type ObjectiveCategory = 'activity' | 'result';

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
  | 'propostas'
  // Recrutamento
  | 'contactos_recrutamento'
  | 'entrevistas_agendadas'
  | 'entrevistas_realizadas'
  | 'formacoes_iniciais'
  // Intermediação de Crédito
  | 'simulacoes_credito'
  | 'processos_submetidos'
  | 'aprovacoes_obtidas';

export type ResultObjectiveType =
  // Vendedores - Angariações
  | 'angariacao_exclusiva'
  | 'angariacao_exclusiva_rede'
  | 'angariacao_reservada'
  // Vendedores - Faturação
  | 'faturacao_vendas'
  | 'faturacao_arrendamentos'
  // Compradores
  | 'reserva_comprador'
  // Recrutamento
  | 'consultores_integrados'
  // Intermediação de Crédito
  | 'creditos_formalizados'
  | 'comissoes_credito';

// Listas controladas de tipos por fluxo
export const activityTypesVendedores = [
  { value: 'posicionamento_vendedores', label: 'Posicionamento' },
  { value: 'leads_vendedores', label: 'Leads Obtidas' },
  { value: 'chamadas_vendedores', label: 'Chamadas Realizadas' },
  { value: 'contactos_efetivos_vendedores', label: 'Contactos Efetivos' },
  { value: 'apresentacoes_servicos', label: 'Apresentações de Serviços' },
  { value: 'seguimentos_vendedores', label: 'Seguimentos Realizados' },
] as const;

export const activityTypesCompradores = [
  { value: 'posicionamento_compradores', label: 'Posicionamento' },
  { value: 'leads_compradores', label: 'Leads Obtidas' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'visitas', label: 'Visitas' },
  { value: 'propostas', label: 'Propostas' },
] as const;

export const activityTypesRecrutamento = [
  { value: 'contactos_recrutamento', label: 'Contactos de Recrutamento' },
  { value: 'entrevistas_agendadas', label: 'Entrevistas Agendadas' },
  { value: 'entrevistas_realizadas', label: 'Entrevistas Realizadas' },
  { value: 'formacoes_iniciais', label: 'Formações Iniciais' },
] as const;

export const activityTypesIntermediacao = [
  { value: 'simulacoes_credito', label: 'Simulações de Crédito' },
  { value: 'processos_submetidos', label: 'Processos Submetidos' },
  { value: 'aprovacoes_obtidas', label: 'Aprovações Obtidas' },
] as const;

export const resultTypesVendedores = [
  { value: 'angariacao_exclusiva', label: 'Angariações (Exclusivo)' },
  { value: 'angariacao_exclusiva_rede', label: 'Angariações (Exclusivo de Rede)' },
  { value: 'angariacao_reservada', label: 'Angariações Reservadas' },
  { value: 'faturacao_vendas', label: 'Faturação (Vendas)' },
  { value: 'faturacao_arrendamentos', label: 'Faturação (Arrendamentos)' },
] as const;

export const resultTypesCompradores = [
  { value: 'reserva_comprador', label: 'Reservas' },
] as const;

export const resultTypesRecrutamento = [
  { value: 'consultores_integrados', label: 'Consultores Integrados' },
] as const;

export const resultTypesIntermediacao = [
  { value: 'creditos_formalizados', label: 'Créditos Formalizados' },
  { value: 'comissoes_credito', label: 'Comissões de Crédito' },
] as const;

// Unidades disponíveis
export const objectiveUnits = [
  { value: 'number', label: 'Número (nº)', symbol: '' },
  { value: 'currency', label: 'Euros (€)', symbol: '€' },
  { value: 'points', label: 'Pontos (pts)', symbol: 'pts' },
] as const;

export type ObjectiveUnit = 'number' | 'currency' | 'points';

export interface Objective {
  id: string;
  flow: ObjectiveFlow;
  objectiveCategory: ObjectiveCategory;
  activityType?: ActivityObjectiveType;
  resultType?: ResultObjectiveType;
  currentValue: number;
  targetValue: number;
  unit: ObjectiveUnit;
  unitSymbol: string;
  startDate: Date;
  endDate: Date;
  targetType: 'agency' | 'agent';
  targetId?: string;
  targetName?: string;
  sourceFilter?: 'all' | string[];
}

// Helper to get objective name from type
export function getObjectiveTypeName(objective: Objective): string {
  if (objective.objectiveCategory === 'activity' && objective.activityType) {
    const vendedorType = activityTypesVendedores.find(t => t.value === objective.activityType);
    if (vendedorType) return vendedorType.label;
    const compradorType = activityTypesCompradores.find(t => t.value === objective.activityType);
    if (compradorType) return compradorType.label;
    const recrutamentoType = activityTypesRecrutamento.find(t => t.value === objective.activityType);
    if (recrutamentoType) return recrutamentoType.label;
    const intermediacaoType = activityTypesIntermediacao.find(t => t.value === objective.activityType);
    if (intermediacaoType) return intermediacaoType.label;
  }
  if (objective.objectiveCategory === 'result' && objective.resultType) {
    const vendedorType = resultTypesVendedores.find(t => t.value === objective.resultType);
    if (vendedorType) return vendedorType.label;
    const compradorType = resultTypesCompradores.find(t => t.value === objective.resultType);
    if (compradorType) return compradorType.label;
    const recrutamentoType = resultTypesRecrutamento.find(t => t.value === objective.resultType);
    if (recrutamentoType) return recrutamentoType.label;
    const intermediacaoType = resultTypesIntermediacao.find(t => t.value === objective.resultType);
    if (intermediacaoType) return intermediacaoType.label;
  }
  return 'Objetivo';
}

// Objective Update
export interface ObjectiveUpdate {
  id: string;
  objectiveId: string;
  objectiveName: string;
  flow: ObjectiveFlow;
  objectiveCategory: ObjectiveCategory;
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
  recrutamento: 'Recrutamento',
  intermediacao_credito: 'Interm. Crédito',
  ambos: 'Todos os Fluxos',
};

export const sourceTypeLabels: Record<SourceType, string> = {
  ativa: 'Ativa',
  passiva: 'Passiva',
};

export const objectiveFlowLabels: Record<ObjectiveFlow, string> = {
  vendedores: 'Vendedores',
  compradores: 'Compradores',
  recrutamento: 'Recrutamento',
  intermediacao_credito: 'Interm. Crédito',
  geral: 'Geral',
};

export const objectiveCategoryLabels: Record<ObjectiveCategory, string> = {
  activity: 'Atividade',
  result: 'Resultado',
};
