import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { key: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.members', icon: Users, href: '/dashboard/members' },
  { key: 'nav.payments', icon: CreditCard, href: '/dashboard/payments' },
  { key: 'nav.reports', icon: FileBarChart, href: '/dashboard/reports' },
  { key: 'nav.notices', icon: Bell, href: '/dashboard/notices' },
  { key: 'nav.constitution', icon: BookOpen, href: '/dashboard/constitution' },
  { key: 'nav.settings', icon: Settings, href: '/dashboard/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
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
          {navItems.map((item) => (
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
                ABC Somiti • Monthly Subscription: Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              AB
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
