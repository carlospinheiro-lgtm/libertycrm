// ============= PROJECT HUB TYPES =============

// Enums de status e tipos
export type ProjectStatus = 'planning' | 'active' | 'at_risk' | 'done' | 'archived';
export type ProjectMemberRole = 'pm' | 'member' | 'finance' | 'viewer';
export type ProjectTaskStatus = 'backlog' | 'todo' | 'doing' | 'blocked' | 'done';
export type ProjectTaskPriority = 'low' | 'medium' | 'high';
export type FinancialItemType = 'cost' | 'revenue';
export type FinancialItemStatus = 'planned' | 'submitted' | 'approved' | 'paid' | 'received' | 'archived';

// Labels para UI
export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: 'Planeamento',
  active: 'Ativo',
  at_risk: 'Em Risco',
  done: 'Concluído',
  archived: 'Arquivado',
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  at_risk: 'bg-orange-100 text-orange-800',
  done: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-800',
};

export const projectMemberRoleLabels: Record<ProjectMemberRole, string> = {
  pm: 'Gestor de Projeto',
  member: 'Membro',
  finance: 'Financeiro',
  viewer: 'Visualizador',
};

export const projectTaskStatusLabels: Record<ProjectTaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  doing: 'Em Curso',
  blocked: 'Bloqueado',
  done: 'Feito',
};

export const projectTaskStatusColors: Record<ProjectTaskStatus, string> = {
  backlog: 'bg-slate-100 text-slate-800',
  todo: 'bg-blue-100 text-blue-800',
  doing: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
  done: 'bg-green-100 text-green-800',
};

export const projectTaskPriorityLabels: Record<ProjectTaskPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export const projectTaskPriorityColors: Record<ProjectTaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-red-100 text-red-600',
};

export const financialItemTypeLabels: Record<FinancialItemType, string> = {
  cost: 'Custo',
  revenue: 'Receita',
};

export const financialItemStatusLabels: Record<FinancialItemStatus, string> = {
  planned: 'Planeado',
  submitted: 'Submetido',
  approved: 'Aprovado',
  paid: 'Pago',
  received: 'Recebido',
  archived: 'Arquivado',
};

export const financialItemStatusColors: Record<FinancialItemStatus, string> = {
  planned: 'bg-slate-100 text-slate-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  received: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

// Interfaces
export interface Project {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  pm_user_id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  pm_user?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  agency?: {
    id: string;
    name: string;
  };
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  is_active: boolean;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assignee_user_id?: string | null;
  due_date?: string | null;
  order_index: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export interface ProjectFinancialItem {
  id: string;
  project_id: string;
  type: FinancialItemType;
  category: string;
  description?: string | null;
  planned_value: number;
  actual_value: number;
  currency: string;
  date_expected?: string | null;
  date_real?: string | null;
  status: FinancialItemStatus;
  vendor_or_client?: string | null;
  responsible_user_id?: string | null;
  attachment_url?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  responsible_user?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export interface ProjectActivityLog {
  id: string;
  project_id: string;
  user_id?: string | null;
  action: string;
  payload_json?: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

// Stats para resumo P&L
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  taskProgress: number;
  plannedRevenue: number;
  actualRevenue: number;
  plannedCost: number;
  actualCost: number;
  plannedResult: number;
  actualResult: number;
  isOverBudget: boolean;
}

// Para criação/edição
export interface CreateProjectInput {
  agency_id: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  pm_user_id?: string; // Opcional - fallback para utilizador atual
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  pm_user_id?: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status?: ProjectTaskStatus;
  priority?: ProjectTaskPriority;
  assignee_user_id?: string;
  due_date?: string;
  order_index?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: ProjectTaskStatus;
  priority?: ProjectTaskPriority;
  assignee_user_id?: string | null;
  due_date?: string | null;
  order_index?: number;
}

export interface CreateFinancialItemInput {
  project_id: string;
  type: FinancialItemType;
  category: string;
  description?: string;
  planned_value?: number;
  actual_value?: number;
  currency?: string;
  date_expected?: string;
  date_real?: string;
  status?: FinancialItemStatus;
  vendor_or_client?: string;
  responsible_user_id?: string;
  notes?: string;
}

export interface UpdateFinancialItemInput {
  category?: string;
  description?: string;
  planned_value?: number;
  actual_value?: number;
  currency?: string;
  date_expected?: string;
  date_real?: string;
  status?: FinancialItemStatus;
  vendor_or_client?: string;
  responsible_user_id?: string;
  attachment_url?: string;
  notes?: string;
}

export interface AddMemberInput {
  project_id: string;
  user_id: string;
  role?: ProjectMemberRole;
}
