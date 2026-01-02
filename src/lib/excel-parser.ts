import * as XLSX from 'xlsx';
import { ImportUserRow, ImportTeamRow, roleMapping } from '@/types/import';

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
  return rawRows.map((row) => {
    // Normalize column names (handle variations)
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '_');
    const normalizedRow: Record<string, string> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeKey(key)] = String(value || '').trim();
    });
    
    // Extract values with fallbacks
    const externalId = normalizedRow['external_id'] || normalizedRow['id_externo'] || normalizedRow['id'] || '';
    const nome = normalizedRow['nome'] || normalizedRow['name'] || '';
    const email = normalizedRow['email'] || normalizedRow['e-mail'] || '';
    const telefone = normalizedRow['telefone'] || normalizedRow['phone'] || normalizedRow['telemovel'] || '';
    const funcao = normalizedRow['funcao'] || normalizedRow['função'] || normalizedRow['role'] || normalizedRow['cargo'] || '';
    const equipa = normalizedRow['equipa'] || normalizedRow['team'] || normalizedRow['equipa_id'] || '';
    const estadoRaw = normalizedRow['estado'] || normalizedRow['status'] || normalizedRow['ativo'] || 'ativo';
    
    // Normalize estado
    const estado = ['inativo', 'inactive', 'false', '0', 'não', 'nao'].includes(estadoRaw.toLowerCase()) 
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
  return rawRows.map((row) => {
    const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '_');
    const normalizedRow: Record<string, string> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[normalizeKey(key)] = String(value || '').trim();
    });
    
    const externalId = normalizedRow['external_id'] || normalizedRow['id_externo'] || normalizedRow['id'] || '';
    const nomeEquipa = normalizedRow['nome_equipa'] || normalizedRow['equipa'] || normalizedRow['name'] || normalizedRow['nome'] || '';
    const liderEquipa = normalizedRow['lider_equipa'] || normalizedRow['líder'] || normalizedRow['lider'] || normalizedRow['leader'] || '';
    const estadoRaw = normalizedRow['estado'] || normalizedRow['status'] || normalizedRow['ativo'] || 'ativo';
    
    const estado = ['inativo', 'inactive', 'false', '0', 'não', 'nao'].includes(estadoRaw.toLowerCase()) 
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
  const normalized = funcao.toLowerCase().trim();
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
