import { useState } from 'react';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Users,
  Home,
  UserPlus,
  FileText,
  Calendar,
  Wallet,
  Target,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-sidebar-foreground" />
            <span className="font-heading text-lg font-bold text-sidebar-foreground">
              Liberty
            </span>
          </div>
        )}
        {collapsed && (
          <Building2 className="h-8 w-8 text-sidebar-foreground mx-auto" />
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
                  collapsed && 'justify-center px-2'
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Toggle Button */}
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
    </aside>
  );
}
