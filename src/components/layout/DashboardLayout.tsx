import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On mobile/tablet, sidebar should be closed by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

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
      {/* Overlay for mobile - closes sidebar when clicking outside */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggle={handleToggleSidebar}
        isOpen={isMobile ? sidebarOpen : true}
        isMobile={isMobile}
        onClose={handleCloseSidebar}
      />

      {/* TopBar */}
      <TopBar 
        sidebarCollapsed={isMobile ? true : sidebarCollapsed} 
        onMenuClick={handleToggleSidebar}
        showMenuButton={isMobile}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isMobile ? 'pl-0' : (sidebarCollapsed ? 'pl-16' : 'pl-64')
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}