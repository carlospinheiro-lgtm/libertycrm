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

// Lead Types
export interface BuyerLead {
  id: string;
  clientId: string;
  client?: Client;
  agency: 'braga' | 'barcelos';
  agentId: string;
  agentName: string;
  source: string;
  entryDate: Date;
  status: string;
  notes: string;
  columnId: string;
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
  source: string;
  entryDate: Date;
  status: string;
  notes: string;
  columnId: string;
}

// Kanban Column
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
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

// Objective
export interface Objective {
  id: string;
  targetType: 'agency' | 'director' | 'agent';
  targetId: string;
  targetName: string;
  objectiveType: 'transactions' | 'listings' | 'leads' | 'revenue' | 'recruitments';
  period: 'monthly' | 'annual';
  year: number;
  month?: number;
  target: number;
  achieved: number;
}
