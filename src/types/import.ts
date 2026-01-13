// Tipos para importação MAXWORK

export interface ImportUserRow {
  external_id: string;
  nome: string;
  email: string;
  telefone?: string;
  funcao: string;  // role name in Portuguese
  equipa?: string; // team external_id
  estado: 'ativo' | 'inativo';
}

export interface ImportTeamRow {
  external_id: string;
  nome_equipa: string;
  nickname?: string;           // apelido/nickname da equipa
  tipo_equipa?: string;        // 'comercial', 'suporte', etc.
  lider_equipa?: string;       // leader external_id
  membros?: string;            // lista de external_ids separados por vírgula ou ;
  estado: 'ativo' | 'inativo';
}

export interface ImportResult {
  created: number;
  updated: number;
  deactivated: number;
  unchanged: number;
  errors: string[];
  // Team member sync results (optional)
  membersCreated?: number;
  membersUpdated?: number;
  membersDeactivated?: number;
}

// Tipo para diferenças entre valores atuais e novos
export interface FieldDiff {
  field: string;
  fieldLabel: string;
  currentValue: string | null;
  newValue: string;
}

// Ações possíveis durante importação
export type ImportAction = 'create' | 'update' | 'no_change' | 'deactivate' | 'skip';

export interface ImportPreviewUser {
  external_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  team?: string;
  isActive: boolean;
  action: ImportAction;
  diffs?: FieldDiff[];  // Diferenças para updates
  requiresConfirmation?: boolean;  // Se precisa confirmação manual
  confirmed?: boolean;  // Se foi confirmado pelo utilizador
  error?: string;
  existingId?: string;  // ID do registo existente
}

export interface ImportPreviewTeam {
  external_id: string;
  name: string;
  nickname?: string;           // apelido
  teamType?: string;           // tipo de equipa
  leader?: string;             // external_id do líder
  members?: string[];          // array de external_ids dos membros
  membersCount?: number;       // contagem de membros
  isActive: boolean;
  action: ImportAction;
  diffs?: FieldDiff[];
  requiresConfirmation?: boolean;
  confirmed?: boolean;
  error?: string;
  existingId?: string;
}

// Mapeamento de funções PT para roles do sistema
export const roleMapping: Record<string, string> = {
  // Direção
  'diretor geral': 'diretor_geral',
  'diretor comercial': 'diretor_comercial',
  'diretor agência': 'diretor_agencia',
  'diretor agencia': 'diretor_agencia',
  'broker': 'diretor_agencia',
  
  // Liderança
  'líder equipa': 'team_leader',
  'lider equipa': 'team_leader',
  'team leader': 'team_leader',
  'leader': 'team_leader',
  
  // Agentes
  'agente imobiliário': 'agente_imobiliario',
  'agente imobiliario': 'agente_imobiliario',
  'agente': 'agente_imobiliario',
  'agente associado': 'agente_imobiliario',
  'associate': 'agente_imobiliario',
  'agent': 'agente_imobiliario',
  
  // RH e Financeiro
  'diretor rh': 'diretor_rh',
  'diretor financeiro': 'diretor_financeiro',
  
  // Backoffice/Suporte
  'gestor backoffice': 'gestor_backoffice',
  'assistente administrativo': 'assistente_administrativo',
  'staff': 'assistente_administrativo',
  'administrativo': 'assistente_administrativo',
  'admin': 'assistente_administrativo',
  
  // Outros
  'consultor externo': 'consultor_externo',
  'consultor': 'consultor_externo',
  
  // Agentes em formação
  'agente em formação': 'agente_imobiliario',
  'agente em formacao': 'agente_imobiliario',
  'trainee': 'agente_imobiliario',
  
  // Gestão de processos
  'gestor de processos': 'gestor_backoffice',
  'gestor(a) de processos': 'gestor_backoffice',
  'gestora de processos': 'gestor_backoffice',
  
  // Assistentes
  'assistente': 'assistente_administrativo',
  
  // Coordenadores
  'coordenador': 'team_leader',
  'coordenador(a)': 'team_leader',
  'coordenadora': 'team_leader',
};
