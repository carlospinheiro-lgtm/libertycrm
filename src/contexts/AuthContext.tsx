import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RBACUser, AppRole, PermissionKey, AccessScope } from '@/types/rbac';
import { currentMockUser, mockUsers, agencies, teams } from '@/data/rbac-data';
import { 
  hasPermission as checkPermission, 
  hasAnyPermission, 
  getMaxScope as getMaxScopeHelper,
  canAccess as canAccessHelper,
  canAccessRoute,
  getUserPermissions,
} from '@/lib/permissions';

interface AuthContextType {
  // Utilizador atual
  currentUser: RBACUser | null;
  isAuthenticated: boolean;
  
  // Helpers de permissões
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;
  getMaxScope: (resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance') => AccessScope;
  canAccessRoute: (path: string) => boolean;
  
  // Verificação de acesso com contexto
  canAccess: (
    targetOwnerId: string,
    targetTeamId: string | undefined,
    targetAgencyId: string,
    resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance',
    action: 'read' | 'update' | 'create' | 'delete'
  ) => boolean;
  
  // Obter todas as permissões do utilizador
  permissions: PermissionKey[];
  
  // Dados auxiliares
  getAgencyName: (agencyId: string) => string;
  getTeamName: (teamId: string) => string;
  getUserById: (userId: string) => RBACUser | undefined;
  
  // Para desenvolvimento: trocar utilizador
  switchUser: (userId: string) => void;
  allUsers: RBACUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Em produção, isto viria da autenticação real
  const [currentUser, setCurrentUser] = useState<RBACUser | null>(currentMockUser);
  
  const isAuthenticated = currentUser !== null;
  
  const userRoles = useMemo(() => currentUser?.roles || [], [currentUser]);
  
  const permissions = useMemo(() => {
    return getUserPermissions(userRoles);
  }, [userRoles]);
  
  const hasPermissionCheck = useCallback((permission: PermissionKey): boolean => {
    return checkPermission(userRoles, permission);
  }, [userRoles]);
  
  const hasAnyPermissionCheck = useCallback((perms: PermissionKey[]): boolean => {
    return hasAnyPermission(userRoles, perms);
  }, [userRoles]);
  
  const getMaxScope = useCallback((resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance'): AccessScope => {
    return getMaxScopeHelper(userRoles, resource);
  }, [userRoles]);
  
  const canAccessRouteCheck = useCallback((path: string): boolean => {
    return canAccessRoute(userRoles, path);
  }, [userRoles]);
  
  const canAccess = useCallback((
    targetOwnerId: string,
    targetTeamId: string | undefined,
    targetAgencyId: string,
    resource: 'leads' | 'objectives' | 'process' | 'recruiting' | 'finance',
    action: 'read' | 'update' | 'create' | 'delete'
  ): boolean => {
    if (!currentUser) return false;
    
    return canAccessHelper(
      userRoles,
      {
        userId: currentUser.id,
        userTeamId: currentUser.teamId,
        userAgencyId: currentUser.agencyId,
        targetOwnerId,
        targetTeamId,
        targetAgencyId,
      },
      resource,
      action
    );
  }, [currentUser, userRoles]);
  
  const getAgencyName = useCallback((agencyId: string): string => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || agencyId;
  }, []);
  
  const getTeamName = useCallback((teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || teamId;
  }, []);
  
  const getUserById = useCallback((userId: string): RBACUser | undefined => {
    return mockUsers.find(u => u.id === userId);
  }, []);
  
  const switchUser = useCallback((userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, []);
  
  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    hasPermission: hasPermissionCheck,
    hasAnyPermission: hasAnyPermissionCheck,
    getMaxScope,
    canAccessRoute: canAccessRouteCheck,
    canAccess,
    permissions,
    getAgencyName,
    getTeamName,
    getUserById,
    switchUser,
    allUsers: mockUsers,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC para proteger componentes
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: PermissionKey
) {
  return function PermissionWrapper(props: P) {
    const { hasPermission } = useAuth();
    
    if (!hasPermission(requiredPermission)) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
}
