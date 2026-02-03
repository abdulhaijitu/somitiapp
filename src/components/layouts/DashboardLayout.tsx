import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant, TenantProvider } from '@/contexts/TenantContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileBarChart,
  Bell,
  BookOpen,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.members', icon: Users, href: '/dashboard/members' },
  { key: 'nav.payments', icon: CreditCard, href: '/dashboard/payments' },
  { key: 'nav.reports', icon: FileBarChart, href: '/dashboard/reports', requiredRole: 'admin' },
  { key: 'nav.notices', icon: Bell, href: '/dashboard/notices' },
  { key: 'nav.constitution', icon: BookOpen, href: '/dashboard/constitution' },
  { key: 'nav.settings', icon: Settings, href: '/dashboard/settings', requiredRole: 'admin' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { t } = useLanguage();
  const { tenant, isLoading, isSubscriptionValid, checkPermission, error, isSuperAdmin } = useTenant();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state (e.g., tenant suspended)
  if (error && !tenant) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRole) return true;
    return isSuperAdmin || checkPermission(item.requiredRole);
  });

  const tenantName = tenant?.name || 'Your Organization';
  const subscriptionStatus = isSubscriptionValid ? 'Active' : 'Expired';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Subscription Banner */}
      <SubscriptionBanner />

      <div className="flex flex-1">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:relative",
            collapsed ? "w-16" : "w-64",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-sidebar-foreground">Somiti</span>
              </div>
            )}
            {collapsed && (
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto scrollbar-thin">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{t(item.key)}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-2">
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{t('auth.logout')}</span>}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top header */}
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-foreground">
                  {t('dashboard.welcome')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {tenantName} • {subscriptionStatus}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <LanguageToggle />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {tenantName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Page content with error boundary */}
          <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <TenantProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </TenantProvider>
  );
}
