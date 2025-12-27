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
  X,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Leads Compradores', path: '/leads-compradores' },
  { icon: Home, label: 'Leads Vendedores', path: '/leads-vendedores' },
  { icon: UserPlus, label: 'Recrutamento', path: '/recrutamento' },
  { icon: FileText, label: 'Gestão Processual', path: '/processos' },
  { icon: CalendarDays, label: 'Mapa de Atividades', path: '/atividades' },
  { icon: Wallet, label: 'Contas Correntes', path: '/contas' },
  { icon: Target, label: 'Objetivos', path: '/objetivos' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Settings, label: 'Administração', path: '/admin' },
];

const adminMenuItems = [
  { icon: Tag, label: 'Origens', path: '/origens' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, isOpen = true, isMobile = false, onClose }: SidebarProps) {
  // On mobile, show/hide based on isOpen prop with overlay behavior
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        isMobile 
          ? 'w-64 shadow-2xl' // Full width on mobile as overlay
          : (collapsed ? 'w-16' : 'w-64')
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {(isMobile || !collapsed) && (
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-sidebar-foreground" />
            <span className="font-heading text-lg font-bold text-sidebar-foreground">
              Liberty
            </span>
          </div>
        )}
        {!isMobile && collapsed && (
          <Building2 className="h-8 w-8 text-sidebar-foreground mx-auto" />
        )}
        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  !isMobile && collapsed && 'justify-center px-2'
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                onClick={isMobile ? onClose : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {(isMobile || !collapsed) && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        
        {/* Admin Section */}
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          {(isMobile || !collapsed) && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">
              Configurações
            </p>
          )}
          <ul className="space-y-1 px-2">
            {adminMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    !isMobile && collapsed && 'justify-center px-2'
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                  onClick={isMobile ? onClose : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(isMobile || !collapsed) && (
                    <span className="text-sm truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Toggle Button - only on desktop */}
      {!isMobile && (
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
      )}
    </aside>
  );
}