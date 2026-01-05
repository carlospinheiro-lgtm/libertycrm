import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { RBACUser, AppRole, PermissionKey, AccessScope } from '@/types/rbac';
import { mockUsers, agencies as mockAgencies, teams as mockTeams } from '@/data/rbac-data';
import { 
  hasPermission as checkPermission, 
  hasAnyPermission, 
  getMaxScope as getMaxScopeHelper,
  canAccess as canAccessHelper,
  canAccessRoute,
  getUserPermissions,
} from '@/lib/permissions';
import type { Database } from '@/integrations/supabase/types';

type DbAppRole = Database['public']['Enums']['app_role'];

// Mapeamento de roles do Supabase para o sistema RBAC local
// Nota: alguns roles do Supabase não existem exatamente no RBAC local, mapeamos para o mais próximo
const roleMapping: Record<DbAppRole, AppRole> = {
  'diretor_geral': 'diretor_geral',
  'diretor_comercial': 'diretor_comercial',
  'diretor_agencia': 'diretor_agencia',
  'team_leader': 'lider_equipa',
  'agente_imobiliario': 'agente_imobiliario',
  'diretor_rh': 'diretor_rh',
  'diretor_financeiro': 'diretor_financeiro',
  'gestor_backoffice': 'coordenadora_loja',
  'assistente_administrativo': 'assistente_direcao',
  'consultor_externo': 'agente_imobiliario',
};

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  
  // Utilizador atual (compatibilidade com sistema RBAC)
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
  
  // Auth actions
  signOut: () => Promise<void>;
  
  // Para desenvolvimento: trocar utilizador (mantido para compatibilidade)
  switchUser: (userId: string) => void;
  allUsers: RBACUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRolesData, setUserRolesData] = useState<{ role: AppRole; agency_id: string }[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; team_id: string | null; agency_id: string | null } | null>(null);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

  // Fetch user data when authenticated
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role, agency_id')
        .eq('user_id', userId);
      
      if (rolesData) {
        setUserRolesData(rolesData.map(r => ({
          role: roleMapping[r.role] || r.role as AppRole,
          agency_id: r.agency_id,
        })));
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      // Fetch user agency info
      const { data: userAgencyData } = await supabase
        .from('user_agencies')
        .select('team_id, agency_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      setUserProfile({
        name: profileData?.name || user?.email || 'Utilizador',
        team_id: userAgencyData?.team_id || null,
        agency_id: userAgencyData?.agency_id || null,
      });

      // Fetch agencies and teams for name lookups
      const { data: agenciesData } = await supabase
        .from('agencies')
        .select('id, name');
      if (agenciesData) setAgencies(agenciesData);

      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name');
      if (teamsData) setTeams(teamsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Defer data fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRolesData([]);
          setUserProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const isAuthenticated = user !== null;
  
  // Build RBACUser from Supabase data
  const currentUser: RBACUser | null = useMemo(() => {
    if (!user || !userProfile) return null;
    
    return {
      id: user.id,
      name: userProfile.name,
      email: user.email || '',
      roles: userRolesData.map(r => r.role),
      agencyId: userProfile.agency_id || userRolesData[0]?.agency_id || '',
      teamId: userProfile.team_id || undefined,
      isActive: true,
      createdAt: new Date(user.created_at || Date.now()),
    };
  }, [user, userProfile, userRolesData]);

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
    if (agency) return agency.name;
    // Fallback to mock data
    const mockAgency = mockAgencies.find(a => a.id === agencyId);
    return mockAgency?.name || agencyId;
  }, [agencies]);
  
  const getTeamName = useCallback((teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    if (team) return team.name;
    // Fallback to mock data
    const mockTeam = mockTeams.find(t => t.id === teamId);
    return mockTeam?.name || teamId;
  }, [teams]);
  
  const getUserById = useCallback((userId: string): RBACUser | undefined => {
    return mockUsers.find(u => u.id === userId);
  }, []);
  
  const switchUser = useCallback((userId: string) => {
    // Mantido para compatibilidade, mas não faz nada na autenticação real
    console.log('switchUser is deprecated with real auth. Use sign out and sign in instead.');
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUserRolesData([]);
    setUserProfile(null);
  }, []);
  
  const value: AuthContextType = {
    user,
    session,
    isLoading,
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
    signOut,
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
