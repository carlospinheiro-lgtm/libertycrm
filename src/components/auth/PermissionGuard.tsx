import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionKey } from '@/types/rbac';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * Componente que protege conteúdo baseado em permissões
 * 
 * @param permission - Permissão única necessária
 * @param permissions - Lista de permissões (usa requireAll para AND/OR)
 * @param requireAll - Se true, precisa de TODAS as permissões; se false, precisa de pelo menos uma
 * @param fallback - Componente a mostrar se não tiver permissão
 */
export function PermissionGuard({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, permissions: userPermissions } = useAuth();
  
  // Verificar permissão única
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }
  
  // Verificar lista de permissões
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      // Precisa de TODAS
      const hasAll = permissions.every(p => userPermissions.includes(p));
      if (!hasAll) {
        return <>{fallback}</>;
      }
    } else {
      // Precisa de pelo menos UMA
      if (!hasAnyPermission(permissions)) {
        return <>{fallback}</>;
      }
    }
  }
  
  return <>{children}</>;
}

/**
 * Componente que protege rotas baseado em permissões
 */
interface RouteGuardProps {
  children: ReactNode;
  path: string;
  fallback?: ReactNode;
}

export function RouteGuard({ children, path, fallback = null }: RouteGuardProps) {
  const { canAccessRoute } = useAuth();
  
  if (!canAccessRoute(path)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
