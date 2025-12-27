// ============= RBAC TYPES =============

// Scopes de acesso (hierárquico: GROUP > AGENCY > TEAM > OWN)
export type AccessScope = 'own' | 'team' | 'agency' | 'group';

// Roles disponíveis
export type AppRole =
  | 'diretor_geral'
  | 'diretor_agencia'
  | 'diretor_comercial'
  | 'lider_equipa'
  | 'agente_imobiliario'
  | 'assistente_agente'
  | 'assistente_equipa'
  | 'assistente_direcao'
  | 'diretor_financeiro'
  | 'coordenadora_loja'
  | 'gestor_marketing'
  | 'diretor_rh'
  | 'recrutador'
  | 'diretor_processual'
  | 'gestor_processual';

// Permission keys organizadas por módulo
export type PermissionKey =
  // Admin/Security
  | 'admin.users.read' | 'admin.users.create' | 'admin.users.update' | 'admin.users.disable'
  | 'admin.roles.read' | 'admin.roles.update'
  | 'admin.settings.read' | 'admin.settings.update'
  | 'admin.audit.read'
  // Leads
  | 'leads.read.own' | 'leads.read.team' | 'leads.read.agency' | 'leads.read.group'
  | 'leads.create'
  | 'leads.update.own' | 'leads.update.team' | 'leads.update.agency'
  // Objetivos/Execução
  | 'objectives.read.own' | 'objectives.read.team' | 'objectives.read.agency' | 'objectives.read.group'
  | 'objectives.manage'
  | 'execution.create' | 'execution.edit'
  | 'reports.read'
  // Processual
  | 'process.read.own' | 'process.read.team' | 'process.read.agency' | 'process.read.group'
  | 'process.update' | 'process.manage'
  // Recrutamento
  | 'recruiting.read.own' | 'recruiting.read.team' | 'recruiting.read.agency' | 'recruiting.read.group'
  | 'recruiting.manage' | 'recruiting.execution.create'
  // Marketing
  | 'marketing.read' | 'marketing.manage' | 'origins.manage'
  // Financeiro
  | 'finance.read.agency' | 'finance.read.group' | 'finance.manage';

// Labels para roles
export const roleLabels: Record<AppRole, string> = {
  diretor_geral: 'Diretor Geral',
  diretor_agencia: 'Diretor de Agência',
  diretor_comercial: 'Diretor Comercial',
  lider_equipa: 'Líder de Equipa',
  agente_imobiliario: 'Agente Imobiliário',
  assistente_agente: 'Assistente de Agente',
  assistente_equipa: 'Assistente de Equipa',
  assistente_direcao: 'Assistente de Direção',
  diretor_financeiro: 'Diretor Financeiro',
  coordenadora_loja: 'Coordenadora de Loja',
  gestor_marketing: 'Gestor de Marketing',
  diretor_rh: 'Diretor de Recursos Humanos',
  recrutador: 'Recrutador',
  diretor_processual: 'Diretor Processual',
  gestor_processual: 'Gestor Processual',
};

// Labels para permissões (organizadas por módulo)
export const permissionLabels: Record<PermissionKey, string> = {
  // Admin
  'admin.users.read': 'Ver utilizadores',
  'admin.users.create': 'Criar utilizadores',
  'admin.users.update': 'Editar utilizadores',
  'admin.users.disable': 'Desativar utilizadores',
  'admin.roles.read': 'Ver funções',
  'admin.roles.update': 'Editar funções',
  'admin.settings.read': 'Ver configurações',
  'admin.settings.update': 'Editar configurações',
  'admin.audit.read': 'Ver auditoria',
  // Leads
  'leads.read.own': 'Ver leads próprias',
  'leads.read.team': 'Ver leads da equipa',
  'leads.read.agency': 'Ver leads da agência',
  'leads.read.group': 'Ver todas as leads',
  'leads.create': 'Criar leads',
  'leads.update.own': 'Editar leads próprias',
  'leads.update.team': 'Editar leads da equipa',
  'leads.update.agency': 'Editar leads da agência',
  // Objetivos
  'objectives.read.own': 'Ver objetivos próprios',
  'objectives.read.team': 'Ver objetivos da equipa',
  'objectives.read.agency': 'Ver objetivos da agência',
  'objectives.read.group': 'Ver todos os objetivos',
  'objectives.manage': 'Gerir objetivos',
  'execution.create': 'Registar execução',
  'execution.edit': 'Editar execução',
  'reports.read': 'Ver relatórios',
  // Processual
  'process.read.own': 'Ver processos próprios',
  'process.read.team': 'Ver processos da equipa',
  'process.read.agency': 'Ver processos da agência',
  'process.read.group': 'Ver todos os processos',
  'process.update': 'Atualizar processos',
  'process.manage': 'Gerir processos',
  // Recrutamento
  'recruiting.read.own': 'Ver recrutamento próprio',
  'recruiting.read.team': 'Ver recrutamento da equipa',
  'recruiting.read.agency': 'Ver recrutamento da agência',
  'recruiting.read.group': 'Ver todo o recrutamento',
  'recruiting.manage': 'Gerir recrutamento',
  'recruiting.execution.create': 'Registar atividade recrutamento',
  // Marketing
  'marketing.read': 'Ver marketing',
  'marketing.manage': 'Gerir marketing',
  'origins.manage': 'Gerir origens',
  // Financeiro
  'finance.read.agency': 'Ver finanças da agência',
  'finance.read.group': 'Ver todas as finanças',
  'finance.manage': 'Gerir finanças',
};

// Módulos de permissão para agrupamento na UI
export const permissionModules = [
  { key: 'admin', label: 'Administração', permissions: ['admin.users.read', 'admin.users.create', 'admin.users.update', 'admin.users.disable', 'admin.roles.read', 'admin.roles.update', 'admin.settings.read', 'admin.settings.update', 'admin.audit.read'] },
  { key: 'leads', label: 'Leads', permissions: ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group', 'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency'] },
  { key: 'objectives', label: 'Objetivos', permissions: ['objectives.read.own', 'objectives.read.team', 'objectives.read.agency', 'objectives.read.group', 'objectives.manage', 'execution.create', 'execution.edit', 'reports.read'] },
  { key: 'process', label: 'Processual', permissions: ['process.read.own', 'process.read.team', 'process.read.agency', 'process.read.group', 'process.update', 'process.manage'] },
  { key: 'recruiting', label: 'Recrutamento', permissions: ['recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency', 'recruiting.read.group', 'recruiting.manage', 'recruiting.execution.create'] },
  { key: 'marketing', label: 'Marketing', permissions: ['marketing.read', 'marketing.manage', 'origins.manage'] },
  { key: 'finance', label: 'Financeiro', permissions: ['finance.read.agency', 'finance.read.group', 'finance.manage'] },
] as const;

// Entidades
export interface Agency {
  id: string;
  name: string;
  code: string;
}

export interface Team {
  id: string;
  name: string;
  agencyId: string;
  leaderUserId?: string;
}

export interface Role {
  id: string;
  name: AppRole;
  displayName: string;
  description: string;
  permissions: PermissionKey[];
}

export interface Permission {
  id: string;
  key: PermissionKey;
  description: string;
  module: string;
}

export interface RBACUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  agencyId: string;
  teamId?: string;
  isActive: boolean;
  createdAt: Date;
  roles: AppRole[];
  // Para Assistente de Agente - operar em nome de um agente
  assignedAgentId?: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

// Scope labels
export const scopeLabels: Record<AccessScope, string> = {
  own: 'Próprio',
  team: 'Equipa',
  agency: 'Agência',
  group: 'Grupo',
};

// Hierarquia de scopes (maior número = maior abrangência)
export const scopeHierarchy: Record<AccessScope, number> = {
  own: 1,
  team: 2,
  agency: 3,
  group: 4,
};
