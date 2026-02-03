import { NavLink } from '@/components/NavLink';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileText,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  DollarSign,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/super-admin' },
  { label: 'Tenants', icon: Building2, href: '/super-admin/tenants' },
  { label: 'Subscriptions', icon: CreditCard, href: '/super-admin/subscriptions' },
  { label: 'Revenue', icon: DollarSign, href: '/super-admin/revenue' },
  { label: 'Monitoring', icon: Activity, href: '/super-admin/monitoring' },
  { label: 'Audit Logs', icon: FileText, href: '/super-admin/audit-logs' },
  { label: 'Settings', icon: Settings, href: '/super-admin/settings' },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
                <Shield className="h-4 w-4 text-destructive-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-sidebar-foreground">Super Admin</span>
                <p className="text-xs text-sidebar-foreground/60">System Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-destructive">
              <Shield className="h-4 w-4 text-destructive-foreground" />
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
              key={item.href}
              to={item.href}
              end={item.href === '/super-admin'}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-2">
          <NavLink
            to="/"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Exit Admin</span>}
          </NavLink>
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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  Super Admin Mode
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Global System Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive text-sm font-medium text-destructive-foreground">
              SA
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
