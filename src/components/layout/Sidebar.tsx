import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Users,
  Home,
  UserPlus,
  FileText,
  CalendarDays,
  Wallet,
  Target,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  FolderKanban,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionKey } from '@/types/rbac';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permissions?: PermissionKey[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'CRM Compradores', path: '/leads-compradores', permissions: ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group'] },
  { icon: Home, label: 'CRM Vendedores', path: '/leads-vendedores', permissions: ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group'] },
  { icon: Building2, label: 'CRM Angariações', path: '/angariacoes', permissions: ['leads.read.own', 'leads.read.team', 'leads.read.agency', 'leads.read.group'] },
  { icon: UserPlus, label: 'CRM Recrutamento', path: '/recrutamento', permissions: ['recruiting.read.own', 'recruiting.read.team', 'recruiting.read.agency', 'recruiting.read.group'] },
  { icon: FileText, label: 'CRM Processual', path: '/processos', permissions: ['process.read.own', 'process.read.team', 'process.read.agency', 'process.read.group'] },
  { icon: CalendarDays, label: 'Mapa de Atividades', path: '/atividades', permissions: ['execution.create', 'execution.edit'] },
  { icon: Wallet, label: 'Pagamentos', path: '/pagamentos', permissions: ['finance.read.agency', 'finance.read.group'] },
  { icon: Target, label: 'Objetivos', path: '/objetivos', permissions: ['objectives.read.own', 'objectives.read.team', 'objectives.read.agency', 'objectives.read.group'] },
  { icon: FolderKanban, label: 'Projetos', path: '/projetos' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Settings, label: 'Administração', path: '/admin', permissions: ['admin.users.read', 'admin.settings.read'] },
];

const adminMenuItems: MenuItem[] = [
  { icon: Tag, label: 'Origens', path: '/origens', permissions: ['origins.manage', 'marketing.manage'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface SidebarMenuItemProps {
  item: MenuItem;
  collapsed: boolean;
}

function SidebarMenuItem({ item, collapsed }: SidebarMenuItemProps) {
  const linkContent = (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <span className="text-sm truncate">{item.label}</span>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { hasAnyPermission } = useAuth();

  // Filtrar itens de menu baseado nas permissões
  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return hasAnyPermission(item.permissions);
    });
  };

  const visibleMenuItems = filterMenuItems(menuItems);
  const visibleAdminItems = filterMenuItems(adminMenuItems);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-sidebar-foreground" />
              <span className="font-heading text-lg font-bold text-sidebar-foreground">
                Liberty
              </span>
            </div>
          ) : (
            <Building2 className="h-8 w-8 text-sidebar-foreground" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <SidebarMenuItem item={item} collapsed={collapsed} />
              </li>
            ))}
          </ul>
          
          {/* Admin Section - só mostra se há itens visíveis */}
          {visibleAdminItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">
                  Configurações
                </p>
              )}
              <ul className="space-y-1 px-2">
                {visibleAdminItems.map((item) => (
                  <li key={item.path}>
                    <SidebarMenuItem item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Toggle Button */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={8}>
              Expandir menu
            </TooltipContent>
          )}
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
