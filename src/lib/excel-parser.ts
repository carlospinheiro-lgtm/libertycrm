import * as XLSX from 'xlsx';
import { ImportUserRow, ImportTeamRow, roleMapping } from '@/types/import';

/**
 * Remove accented characters for normalization
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize column keys - lowercase, no accents, underscores for spaces
 */
function normalizeKey(key: string): string {
  return removeAccents(key.toLowerCase().trim().replace(/\s+/g, '_'));
}

/**
 * Parse both Excel (.xlsx, .xls) and CSV files
 */
export function parseFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        // XLSX library can handle both Excel and CSV files
        const workbook = XLSX.read(data, { 
          type: extension === 'csv' ? 'string' : 'binary',
          raw: false,
          codepage: 65001, // UTF-8 for CSV
        });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (error) {
        const fileType = extension === 'csv' ? 'CSV' : 'Excel';
        reject(new Error(`Erro ao processar ficheiro ${fileType}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler ficheiro'));
    };
    
    // Read as text for CSV, binary for Excel
    if (extension === 'csv') {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsBinaryString(file);
    }
  });
}

/**
 * @deprecated Use parseFile instead
 */
export function parseExcelFile<T>(file: File): Promise<T[]> {
  return parseFile<T>(file);
}

export function parseUserRows(rawRows: Record<string, unknown>[]): ImportUserRow[] {
  if (rawRows.length === 0) return [];
  
  // Debug: log original column names
  console.log('[Import] Colunas originais:', Object.keys(rawRows[0]));
  
  return rawRows.map((row) => {
    const normalizedRow: Record<string, string> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeKey(key)] = String(value || '').trim();
    });
    
    // Helper to find value from multiple possible column names
    const findValue = (...keys: string[]): string => {
      for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        if (normalizedRow[normalizedKey]) {
          return normalizedRow[normalizedKey];
        }
      }
      return '';
    };
    
    // Extract values with extended fallbacks for MAXWORK variations
    const externalId = findValue('external_id', 'id_externo', 'id', 'user_id', 'userid', 'codigo', 'code');
    const nome = findValue('nome', 'name', 'nome_completo', 'full_name', 'utilizador', 'user', 'username');
    const email = findValue('email', 'e-mail', 'mail', 'e_mail', 'correio');
    const telefone = findValue('telefone', 'phone', 'telemovel', 'mobile', 'contacto', 'tel');
    const funcao = findValue('funcao', 'função', 'role', 'cargo', 'rolename', 'role_name', 'perfil', 'tipo', 'position', 'posicao');
    const equipa = findValue('equipa', 'team', 'equipa_id', 'team_id', 'grupo', 'group', 'team_name', 'nome_equipa');
    const estadoRaw = findValue('estado', 'status', 'ativo', 'active', 'is_active', 'activo') || 'ativo';
    
    // Normalize estado
    const estado = ['inativo', 'inactive', 'false', '0', 'não', 'nao', 'no', 'disabled'].includes(estadoRaw.toLowerCase()) 
      ? 'inativo' 
      : 'ativo';
    
    return {
      external_id: externalId,
      nome,
      email,
      telefone: telefone || undefined,
      funcao,
      equipa: equipa || undefined,
      estado,
    };
  });
}

export function parseTeamRows(rawRows: Record<string, unknown>[]): ImportTeamRow[] {
  if (rawRows.length === 0) return [];
  
  // Debug: log original column names
  console.log('[Import] Colunas originais (equipas):', Object.keys(rawRows[0]));
  
  return rawRows.map((row) => {
    const normalizedRow: Record<string, string> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeKey(key)] = String(value || '').trim();
    });
    
    // Helper to find value from multiple possible column names
    const findValue = (...keys: string[]): string => {
      for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        if (normalizedRow[normalizedKey]) {
          return normalizedRow[normalizedKey];
        }
      }
      return '';
    };
    
    // Extract values with extended fallbacks for MAXWORK variations
    const externalId = findValue('external_id', 'id_externo', 'id', 'team_id', 'teamid', 'codigo', 'code');
    const nomeEquipa = findValue('nome_equipa', 'equipa', 'name', 'nome', 'team_name', 'team', 'nome_da_equipa', 'teamname', 'grupo', 'group');
    const liderEquipa = findValue('lider_equipa', 'líder', 'lider', 'leader', 'leader_id', 'responsavel', 'responsável', 'chefe', 'manager', 'team_leader');
    const estadoRaw = findValue('estado', 'status', 'ativo', 'active', 'is_active', 'activo') || 'ativo';
    
    const estado = ['inativo', 'inactive', 'false', '0', 'não', 'nao', 'no', 'disabled'].includes(estadoRaw.toLowerCase()) 
      ? 'inativo' 
      : 'ativo';
    
    return {
      external_id: externalId,
      nome_equipa: nomeEquipa,
      lider_equipa: liderEquipa || undefined,
      estado,
    };
  });
}

export function normalizeRole(funcao: string): string | null {
  const normalized = removeAccents(funcao.toLowerCase().trim());
  return roleMapping[normalized] || null;
}

export function validateUserRow(row: ImportUserRow, index: number): string | null {
  if (!row.external_id) {
    return `Linha ${index + 2}: ID externo é obrigatório`;
  }
  if (!row.nome) {
    return `Linha ${index + 2}: Nome é obrigatório`;
  }
  if (!row.email) {
    return `Linha ${index + 2}: Email é obrigatório`;
  }
  if (!row.email.includes('@')) {
    return `Linha ${index + 2}: Email inválido`;
  }
  if (!row.funcao) {
    return `Linha ${index + 2}: Função é obrigatória`;
  }
  if (!normalizeRole(row.funcao)) {
    return `Linha ${index + 2}: Função "${row.funcao}" não reconhecida`;
  }
  return null;
}

export function validateTeamRow(row: ImportTeamRow, index: number): string | null {
  if (!row.external_id) {
    return `Linha ${index + 2}: ID externo é obrigatório`;
  }
  if (!row.nome_equipa) {
    return `Linha ${index + 2}: Nome da equipa é obrigatório`;
  }
  return null;
}
