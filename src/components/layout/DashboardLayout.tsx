import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop: expanded; Mobile/Tablet: collapsed (icons only)
  useEffect(() => {
    if (isDesktop) {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  }, [isDesktop]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      {/* TopBar */}
      <TopBar 
        sidebarCollapsed={sidebarCollapsed} 
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}