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

  // Desktop: expanded; Tablet: collapsed; Mobile: hidden
  useEffect(() => {
    if (isDesktop) {
      // Desktop (> 1024px): sidebar always expanded
      setSidebarCollapsed(false);
    } else if (isMobile) {
      // Mobile (< 768px): sidebar hidden by default
      setSidebarOpen(false);
      setSidebarCollapsed(true);
    } else {
      // Tablet (768px - 1024px): sidebar collapsed (icons only)
      setSidebarCollapsed(true);
    }
  }, [isMobile, isTablet, isDesktop]);

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