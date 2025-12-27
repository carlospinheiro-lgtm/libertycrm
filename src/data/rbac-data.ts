import { Agency, Team, Role, RBACUser, AppRole, PermissionKey } from '@/types/rbac';

// ============= AGÊNCIAS =============
export const agencies: Agency[] = [
  { id: 'braga', name: 'Liberty Braga', code: 'braga' },
  { id: 'barcelos', name: 'Liberty Barcelos', code: 'barcelos' },
  { id: 'porto', name: 'Liberty Porto', code: 'porto' },
  { id: 'guimaraes', name: 'Liberty Guimarães', code: 'guimaraes' },
];

// ============= EQUIPAS =============
export const teams: Team[] = [
  { id: 'team-norte', name: 'Equipa Norte', agencyId: 'braga', leaderUserId: 'user-joao' },
  { id: 'team-sul', name: 'Equipa Sul', agencyId: 'barcelos', leaderUserId: 'user-maria' },
  { id: 'team-centro', name: 'Equipa Centro', agencyId: 'porto' },
  { id: 'team-minho', name: 'Equipa Minho', agencyId: 'guimaraes' },
];

// ============= PERMISSÕES POR ROLE =============
export const rolePermissions: Record<AppRole, PermissionKey[]> = {
  // Diretor Geral - TODAS as permissões
  diretor_geral: [
    'admin.users.read', 'admin.users.create', 'admin.users.update', 'admin.users.disable',
    'admin.roles.read', 'admin.roles.update',
    'admin.settings.read', 'admin.settings.update',
    'admin.audit.read',
    'leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group',
    'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency',
    'objectives.read.own', 'objectives.read.team', 'objectives.read.agency', 'objectives.read.group',
    'objectives.manage', 'execution.create', 'execution.edit', 'reports.read',
    'process.read.own', 'process.read.team', 'process.read.agency', 'process.read.group',
    'process.update', 'process.manage',
    'recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency', 'recruiting.read.group',
    'recruiting.manage', 'recruiting.execution.create',
    'marketing.read', 'marketing.manage', 'origins.manage',
    'finance.read.agency', 'finance.read.group', 'finance.manage',
  ],

  // Diretor de Agência - Scope AGENCY
  diretor_agencia: [
    'admin.users.read', 'admin.users.create', 'admin.users.update', 'admin.users.disable',
    'admin.settings.read',
    'leads.read.own', 'leads.read.team', 'leads.read.agency',
    'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency',
    'objectives.read.own', 'objectives.read.team', 'objectives.read.agency',
    'objectives.manage', 'execution.create', 'execution.edit', 'reports.read',
    'process.read.own', 'process.read.team', 'process.read.agency',
    'process.update', 'process.manage',
    'recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency',
    'recruiting.manage', 'recruiting.execution.create',
    'finance.read.agency',
  ],

  // Diretor Comercial - Scope AGENCY para leads/objectives/execution
  diretor_comercial: [
    'leads.read.own', 'leads.read.team', 'leads.read.agency',
    'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency',
    'objectives.read.own', 'objectives.read.team', 'objectives.read.agency',
    'objectives.manage', 'execution.create', 'execution.edit', 'reports.read',
  ],

  // Líder de Equipa - Scope TEAM
  lider_equipa: [
    'leads.read.own', 'leads.read.team',
    'leads.create', 'leads.update.own', 'leads.update.team',
    'objectives.read.own', 'objectives.read.team',
    'objectives.manage', 'execution.create', 'execution.edit', 'reports.read',
  ],

  // Agente Imobiliário - Scope OWN
  agente_imobiliario: [
    'leads.read.own',
    'leads.create', 'leads.update.own',
    'objectives.read.own',
    'execution.create',
  ],

  // Assistente de Agente - Operar em nome do agente atribuído
  assistente_agente: [
    'leads.read.own',
    'leads.create', 'leads.update.own',
    'objectives.read.own',
    'execution.create',
  ],

  // Assistente de Equipa - Scope TEAM para apoio operacional
  assistente_equipa: [
    'leads.read.own', 'leads.read.team',
    'leads.create', 'leads.update.own', 'leads.update.team',
    'objectives.read.own', 'objectives.read.team',
    'execution.create',
  ],

  // Assistente de Direção - Scope AGENCY + reports
  assistente_direcao: [
    'leads.read.own', 'leads.read.team', 'leads.read.agency',
    'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency',
    'objectives.read.own', 'objectives.read.team', 'objectives.read.agency',
    'objectives.manage', 'execution.create', 'reports.read',
  ],

  // Diretor Financeiro - Finance + reports
  diretor_financeiro: [
    'finance.read.agency', 'finance.read.group', 'finance.manage',
    'reports.read',
  ],

  // Coordenadora de Loja - Leads agency + execution
  coordenadora_loja: [
    'leads.read.own', 'leads.read.team', 'leads.read.agency',
    'leads.create', 'leads.update.own', 'leads.update.team', 'leads.update.agency',
    'execution.create',
  ],

  // Gestor de Marketing
  gestor_marketing: [
    'marketing.read', 'marketing.manage', 'origins.manage',
    'leads.read.own', 'leads.read.team', 'leads.read.agency',
  ],

  // Diretor de RH
  diretor_rh: [
    'recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency', 'recruiting.read.group',
    'recruiting.manage', 'recruiting.execution.create',
    'reports.read',
  ],

  // Recrutador
  recrutador: [
    'recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency',
    'recruiting.manage', 'recruiting.execution.create',
  ],

  // Diretor Processual
  diretor_processual: [
    'process.read.own', 'process.read.team', 'process.read.agency',
    'process.update', 'process.manage',
    'reports.read',
  ],

  // Gestor Processual
  gestor_processual: [
    'process.read.own', 'process.read.team', 'process.read.agency',
    'process.update',
  ],
};

// ============= ROLES =============
export const roles: Role[] = [
  { id: 'role-dg', name: 'diretor_geral', displayName: 'Diretor Geral', description: 'Acesso total a todo o sistema', permissions: rolePermissions.diretor_geral },
  { id: 'role-da', name: 'diretor_agencia', displayName: 'Diretor de Agência', description: 'Gestão completa da agência', permissions: rolePermissions.diretor_agencia },
  { id: 'role-dc', name: 'diretor_comercial', displayName: 'Diretor Comercial', description: 'Gestão comercial da agência', permissions: rolePermissions.diretor_comercial },
  { id: 'role-le', name: 'lider_equipa', displayName: 'Líder de Equipa', description: 'Gestão da equipa', permissions: rolePermissions.lider_equipa },
  { id: 'role-ai', name: 'agente_imobiliario', displayName: 'Agente Imobiliário', description: 'Operações comerciais próprias', permissions: rolePermissions.agente_imobiliario },
  { id: 'role-aa', name: 'assistente_agente', displayName: 'Assistente de Agente', description: 'Apoio a agente específico', permissions: rolePermissions.assistente_agente },
  { id: 'role-ae', name: 'assistente_equipa', displayName: 'Assistente de Equipa', description: 'Apoio operacional à equipa', permissions: rolePermissions.assistente_equipa },
  { id: 'role-ad', name: 'assistente_direcao', displayName: 'Assistente de Direção', description: 'Apoio à direção da agência', permissions: rolePermissions.assistente_direcao },
  { id: 'role-df', name: 'diretor_financeiro', displayName: 'Diretor Financeiro', description: 'Gestão financeira do grupo', permissions: rolePermissions.diretor_financeiro },
  { id: 'role-cl', name: 'coordenadora_loja', displayName: 'Coordenadora de Loja', description: 'Recepção e apoio comercial', permissions: rolePermissions.coordenadora_loja },
  { id: 'role-gm', name: 'gestor_marketing', displayName: 'Gestor de Marketing', description: 'Gestão de marketing e origens', permissions: rolePermissions.gestor_marketing },
  { id: 'role-drh', name: 'diretor_rh', displayName: 'Diretor de RH', description: 'Gestão de recursos humanos', permissions: rolePermissions.diretor_rh },
  { id: 'role-rec', name: 'recrutador', displayName: 'Recrutador', description: 'Recrutamento de candidatos', permissions: rolePermissions.recrutador },
  { id: 'role-dp', name: 'diretor_processual', displayName: 'Diretor Processual', description: 'Gestão processual do grupo', permissions: rolePermissions.diretor_processual },
  { id: 'role-gp', name: 'gestor_processual', displayName: 'Gestor Processual', description: 'Gestão de processos', permissions: rolePermissions.gestor_processual },
];

// ============= UTILIZADORES MOCK =============
export const mockUsers: RBACUser[] = [
  {
    id: 'user-admin',
    name: 'Carlos Administrador',
    email: 'admin@liberty.pt',
    phone: '912345678',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    roles: ['diretor_geral'],
  },
  {
    id: 'user-joao',
    name: 'João Silva',
    email: 'joao.silva@liberty.pt',
    phone: '913456789',
    agencyId: 'braga',
    teamId: 'team-norte',
    isActive: true,
    createdAt: new Date('2023-02-15'),
    roles: ['diretor_comercial', 'lider_equipa'], // Multi-role
  },
  {
    id: 'user-maria',
    name: 'Maria Santos',
    email: 'maria.santos@liberty.pt',
    phone: '914567890',
    agencyId: 'barcelos',
    teamId: 'team-sul',
    isActive: true,
    createdAt: new Date('2023-03-01'),
    roles: ['lider_equipa'],
  },
  {
    id: 'user-ana',
    name: 'Ana Costa',
    email: 'ana.costa@liberty.pt',
    phone: '915678901',
    agencyId: 'braga',
    teamId: 'team-norte',
    isActive: true,
    createdAt: new Date('2023-04-10'),
    roles: ['agente_imobiliario'],
  },
  {
    id: 'user-pedro',
    name: 'Pedro Assistente',
    email: 'pedro.assist@liberty.pt',
    agencyId: 'braga',
    teamId: 'team-norte',
    isActive: true,
    createdAt: new Date('2023-05-20'),
    roles: ['assistente_agente'],
    assignedAgentId: 'user-ana', // Atribuído à Ana
  },
  {
    id: 'user-sofia',
    name: 'Sofia Direção',
    email: 'sofia.direcao@liberty.pt',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-06-01'),
    roles: ['assistente_direcao'],
  },
  {
    id: 'user-rui',
    name: 'Rui Financeiro',
    email: 'rui.financeiro@liberty.pt',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-06-15'),
    roles: ['diretor_financeiro'],
  },
  {
    id: 'user-carla',
    name: 'Carla Recepção',
    email: 'carla.recepcao@liberty.pt',
    agencyId: 'porto',
    isActive: true,
    createdAt: new Date('2023-07-01'),
    roles: ['coordenadora_loja'],
  },
  {
    id: 'user-miguel',
    name: 'Miguel Marketing',
    email: 'miguel.mkt@liberty.pt',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-07-15'),
    roles: ['gestor_marketing'],
  },
  {
    id: 'user-isabel',
    name: 'Isabel RH',
    email: 'isabel.rh@liberty.pt',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-08-01'),
    roles: ['diretor_rh'],
  },
  {
    id: 'user-tiago',
    name: 'Tiago Recrutador',
    email: 'tiago.recruit@liberty.pt',
    agencyId: 'barcelos',
    isActive: true,
    createdAt: new Date('2023-08-15'),
    roles: ['recrutador'],
  },
  {
    id: 'user-luis',
    name: 'Luís Processual',
    email: 'luis.proc@liberty.pt',
    agencyId: 'braga',
    isActive: true,
    createdAt: new Date('2023-09-01'),
    roles: ['diretor_processual'],
  },
  {
    id: 'user-paulo',
    name: 'Paulo Agente',
    email: 'paulo.agente@liberty.pt',
    agencyId: 'porto',
    teamId: 'team-centro',
    isActive: true,
    createdAt: new Date('2023-09-15'),
    roles: ['agente_imobiliario'],
  },
  {
    id: 'user-ines',
    name: 'Inês Desativada',
    email: 'ines.old@liberty.pt',
    agencyId: 'braga',
    isActive: false,
    createdAt: new Date('2022-01-01'),
    roles: ['agente_imobiliario'],
  },
];

// Utilizador atual mock (para desenvolvimento)
// Em produção, isto virá da autenticação
export const currentMockUser: RBACUser = mockUsers[0]; // Carlos Administrador (Diretor Geral)
