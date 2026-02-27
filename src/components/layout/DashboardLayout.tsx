import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-mobile';
import { AgentFilterProvider } from '@/contexts/AgentFilterContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <AgentFilterProvider>
      <div className="min-h-screen bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <TopBar 
          sidebarCollapsed={sidebarCollapsed} 
        />
        <main
          className={cn(
            'pt-16 min-h-screen transition-all duration-300',
            sidebarCollapsed ? 'pl-16' : 'pl-64'
          )}
        >
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </AgentFilterProvider>
  );
}
