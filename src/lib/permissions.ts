import { AccessScope, AppRole, PermissionKey, scopeHierarchy } from '@/types/rbac';
import { rolePermissions } from '@/data/rbac-data';

/**
 * Obtém todas as permissões de um utilizador baseado nas suas roles
 * (Multi-role: união de todas as permissões)
 */
export function getUserPermissions(roles: AppRole[]): PermissionKey[] {
  const permissionsSet = new Set<PermissionKey>();
  
  roles.forEach(role => {
    const perms = rolePermissions[role] || [];
    perms.forEach(perm => permissionsSet.add(perm));
  });
  
  return Array.from(permissionsSet);
}

/**
 * Verifica se o utilizador tem uma permissão específica
 */
export function hasPermission(roles: AppRole[], permission: PermissionKey): boolean {
  const userPermissions = getUserPermissions(roles);
  return userPermissions.includes(permission);
}

/**
 * Verifica se o utilizador tem QUALQUER uma das permissões
 */
export function hasAnyPermission(roles: AppRole[], permissions: PermissionKey[]): boolean {
  const userPermissions = getUserPermissions(roles);
  return permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Verifica se o utilizador tem TODAS as permissões
 */
export function hasAllPermissions(roles: AppRole[], permissions: PermissionKey[]): boolean {
  const userPermissions = getUserPermissions(roles);
  return permissions.every(perm => userPermissions.includes(perm));
}

/**
 * Obtém o scope máximo do utilizador para um determinado recurso
 */
export function getMaxScope(roles: AppRole[], resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance'): AccessScope {
  const userPermissions = getUserPermissions(roles);
  
  // Verificar do maior para o menor
  const scopeOrder: AccessScope[] = ['group', 'agency', 'team', 'own'];
  
  for (const scope of scopeOrder) {
    const permissionKey = `${resource}.read.${scope}` as PermissionKey;
    if (userPermissions.includes(permissionKey)) {
      return scope;
    }
  }
  
  return 'own'; // Default mais restritivo
}

/**
 * Verifica se um scope é igual ou superior a outro na hierarquia
 */
export function isScopeAtLeast(userScope: AccessScope, requiredScope: AccessScope): boolean {
  return scopeHierarchy[userScope] >= scopeHierarchy[requiredScope];
}

/**
 * Interface para contexto de acesso
 */
interface AccessContext {
  userId: string;
  userTeamId?: string;
  userAgencyId: string;
  targetOwnerId: string;
  targetTeamId?: string;
  targetAgencyId: string;
}

/**
 * Determina o scope necessário para aceder a um recurso alvo
 */
export function getRequiredScope(context: AccessContext): AccessScope {
  const { userId, userTeamId, userAgencyId, targetOwnerId, targetTeamId, targetAgencyId } = context;
  
  // Se é o próprio utilizador
  if (userId === targetOwnerId) {
    return 'own';
  }
  
  // Se está na mesma equipa
  if (userTeamId && targetTeamId && userTeamId === targetTeamId) {
    return 'team';
  }
  
  // Se está na mesma agência
  if (userAgencyId === targetAgencyId) {
    return 'agency';
  }
  
  // Caso contrário, precisa de scope GROUP
  return 'group';
}

/**
 * Verificação central de acesso
 * 
 * @param roles - Roles do utilizador
 * @param context - Contexto de acesso (IDs do utilizador e do alvo)
 * @param resource - Recurso a aceder (leads, objectives, etc.)
 * @param action - Ação a realizar (read, update, etc.)
 */
export function canAccess(
  roles: AppRole[],
  context: AccessContext,
  resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance',
  action: 'read' | 'update' | 'create' | 'delete'
): boolean {
  // Obter o scope máximo do utilizador para este recurso
  const userMaxScope = getMaxScope(roles, resource);
  
  // Determinar o scope necessário para o alvo
  const requiredScope = getRequiredScope(context);
  
  // Verificar se o scope do utilizador cobre o scope necessário
  return isScopeAtLeast(userMaxScope, requiredScope);
}

/**
 * Filtra lista de itens baseado no scope do utilizador
 */
export function filterByScope<T extends { ownerId: string; teamId?: string; agencyId: string }>(
  items: T[],
  roles: AppRole[],
  userId: string,
  userTeamId: string | undefined,
  userAgencyId: string,
  resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance'
): T[] {
  const maxScope = getMaxScope(roles, resource);
  
  return items.filter(item => {
    const context: AccessContext = {
      userId,
      userTeamId,
      userAgencyId,
      targetOwnerId: item.ownerId,
      targetTeamId: item.teamId,
      targetAgencyId: item.agencyId,
    };
    
    const requiredScope = getRequiredScope(context);
    return isScopeAtLeast(maxScope, requiredScope);
  });
}

/**
 * Verifica permissões de menu/navegação
 */
export const menuPermissions: Record<string, PermissionKey[]> = {
  '/': [], // Dashboard - todos podem ver
  '/leads-compradores': ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group'],
  '/leads-vendedores': ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group'],
  '/recrutamento': ['recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency', 'recruiting.read.group'],
  '/processos': ['process.read.own', 'process.read.team', 'process.read.agency', 'process.read.group'],
  '/atividades': ['execution.create', 'execution.edit'],
  '/contas': ['finance.read.agency', 'finance.read.group'],
  '/objetivos': ['objectives.read.own', 'objectives.read.team', 'objectives.read.agency', 'objectives.read.group'],
  '/agenda': [], // Todos podem ver a agenda
  '/admin': ['admin.users.read', 'admin.settings.read'],
  '/origens': ['origins.manage', 'marketing.manage'],
};

/**
 * Verifica se o utilizador pode aceder a um menu/rota
 */
export function canAccessRoute(roles: AppRole[], path: string): boolean {
  const requiredPermissions = menuPermissions[path];
  
  // Se não há permissões definidas, permite acesso
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  // Precisa de pelo menos uma das permissões
  return hasAnyPermission(roles, requiredPermissions);
}
