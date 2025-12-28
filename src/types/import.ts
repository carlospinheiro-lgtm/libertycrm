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
  lider_equipa?: string; // leader external_id
  estado: 'ativo' | 'inativo';
}

export interface ImportResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

export interface ImportPreviewUser {
  external_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  team?: string;
  isActive: boolean;
  action: 'create' | 'update' | 'deactivate' | 'skip';
  error?: string;
}

export interface ImportPreviewTeam {
  external_id: string;
  name: string;
  leader?: string;
  isActive: boolean;
  action: 'create' | 'update' | 'deactivate' | 'skip';
  error?: string;
}

// Mapeamento de funções PT para roles do sistema
export const roleMapping: Record<string, string> = {
  'diretor geral': 'diretor_geral',
  'diretor comercial': 'diretor_comercial',
  'diretor agência': 'diretor_agencia',
  'diretor agencia': 'diretor_agencia',
  'líder equipa': 'team_leader',
  'lider equipa': 'team_leader',
  'team leader': 'team_leader',
  'agente imobiliário': 'agente_imobiliario',
  'agente imobiliario': 'agente_imobiliario',
  'agente': 'agente_imobiliario',
  'diretor rh': 'diretor_rh',
  'diretor financeiro': 'diretor_financeiro',
  'gestor backoffice': 'gestor_backoffice',
  'assistente administrativo': 'assistente_administrativo',
  'consultor externo': 'consultor_externo',
};
