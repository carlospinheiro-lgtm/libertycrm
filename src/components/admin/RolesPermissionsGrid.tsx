import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roles } from '@/data/rbac-data';
import { permissionModules, permissionLabels, roleLabels, PermissionKey, AppRole } from '@/types/rbac';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Lock } from 'lucide-react';

export function RolesPermissionsGrid() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('admin.roles.update');
  
  // Estado local para edição (em produção, viria da API)
  const [editedPermissions, setEditedPermissions] = useState<Record<string, PermissionKey[]>>(() => {
    const initial: Record<string, PermissionKey[]> = {};
    roles.forEach(role => {
      initial[role.name] = [...role.permissions];
    });
    return initial;
  });

  const handlePermissionToggle = (roleName: AppRole, permission: PermissionKey) => {
    if (!canEdit) return;
    
    setEditedPermissions(prev => {
      const current = prev[roleName] || [];
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission];
      return { ...prev, [roleName]: updated };
    });
  };

  const handleSave = () => {
    // Em produção, isto faria uma chamada à API
    console.log('Saving permissions:', editedPermissions);
    toast.success('Permissões guardadas com sucesso');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Permissões</h3>
          <p className="text-sm text-muted-foreground">
            {canEdit 
              ? 'Clique nas células para ativar/desativar permissões'
              : 'Apenas o Diretor Geral pode editar permissões'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Alterações
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-muted/50 border rounded-lg p-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Modo de visualização. Contacte o Diretor Geral para alterar permissões.
          </p>
        </div>
      )}

      {/* Grid por módulo */}
      <div className="space-y-6">
        {permissionModules.map(module => (
          <div key={module.key} className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-medium">{module.label}</h4>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 min-w-[200px] sticky left-0 bg-background">
                      Permissão
                    </th>
                    {roles.map(role => (
                      <th 
                        key={role.name} 
                        className="text-center p-2 min-w-[100px]"
                        title={role.description}
                      >
                        <span className="text-xs whitespace-nowrap">
                          {roleLabels[role.name]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {module.permissions.map((permission) => (
                    <tr key={permission} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 sticky left-0 bg-background">
                        <span className="text-sm">
                          {permissionLabels[permission as PermissionKey]}
                        </span>
                      </td>
                      {roles.map(role => {
                        const hasIt = editedPermissions[role.name]?.includes(permission as PermissionKey);
                        return (
                          <td key={role.name} className="text-center p-2">
                            <Checkbox
                              checked={hasIt}
                              disabled={!canEdit}
                              onCheckedChange={() => 
                                handlePermissionToggle(role.name, permission as PermissionKey)
                              }
                              className={canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium mb-2">Legenda de Funções</h4>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <Badge key={role.name} variant="outline" className="text-xs">
              {roleLabels[role.name]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
