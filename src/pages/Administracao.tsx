import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTable } from '@/components/admin/UsersTable';
import { RolesPermissionsGrid } from '@/components/admin/RolesPermissionsGrid';
import { AgenciesTeamsPanel } from '@/components/admin/AgenciesTeamsPanel';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { UserSwitcher } from '@/components/admin/UserSwitcher';
import { ImportsPanel } from '@/components/admin/imports';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Building2, Settings, Lock, Upload } from 'lucide-react';

export default function Administracao() {
  const { hasPermission, hasAnyPermission } = useAuth();
  
  // Verificar se tem alguma permissão de admin
  const canAccessUsers = hasAnyPermission(['admin.users.read', 'admin.users.create']);
  const canAccessRoles = hasPermission('admin.roles.read');
  const canAccessAgencies = hasAnyPermission(['admin.users.read', 'admin.settings.read']);
  const canAccessSettings = hasPermission('admin.settings.read');

  // Determinar tab inicial baseado nas permissões
  const getDefaultTab = () => {
    if (canAccessUsers) return 'users';
    if (canAccessRoles) return 'roles';
    if (canAccessAgencies) return 'agencies';
    if (canAccessSettings) return 'settings';
    return 'users';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administração</h1>
            <p className="text-muted-foreground">
              Gestão de utilizadores, permissões e estrutura organizacional
            </p>
          </div>
          
          {/* User Switcher - apenas em desenvolvimento */}
          <div className="w-full sm:w-80">
            <UserSwitcher />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={getDefaultTab()} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 bg-transparent p-1 h-auto">
            <TabsTrigger 
              value="users" 
              disabled={!canAccessUsers}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                         data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                         hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilizadores</span>
              {!canAccessUsers && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              disabled={!canAccessRoles}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                         data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                         hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Funções</span>
              {!canAccessRoles && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger 
              value="agencies" 
              disabled={!canAccessAgencies}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                         data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                         hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Agências</span>
              {!canAccessAgencies && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              disabled={!canAccessSettings}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                         data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground
                         hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
              {!canAccessSettings && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <PermissionGuard 
              permissions={['admin.users.read', 'admin.users.create']} 
              fallback={<NoAccessMessage />}
            >
              <UsersTable />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <PermissionGuard 
              permission="admin.roles.read" 
              fallback={<NoAccessMessage />}
            >
              <RolesPermissionsGrid />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="agencies" className="mt-6">
            <PermissionGuard 
              permissions={['admin.users.read', 'admin.settings.read']} 
              fallback={<NoAccessMessage />}
            >
              <AgenciesTeamsPanel />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <PermissionGuard 
              permission="admin.settings.read" 
              fallback={<NoAccessMessage />}
            >
              <SettingsPanel />
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function NoAccessMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Lock className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Acesso Restrito</h3>
      <p className="text-muted-foreground mt-1">
        Não tem permissão para aceder a esta secção.
      </p>
    </div>
  );
}
