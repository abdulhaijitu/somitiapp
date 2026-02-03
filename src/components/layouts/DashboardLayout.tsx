import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant, TenantProvider } from '@/contexts/TenantContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SubscriptionBanner } from '@/components/common/SubscriptionBanner';
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NoIndexSEO } from '@/components/common/SEO';
import { MobileBottomNav, BottomNavItem } from '@/components/common/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { DeveloperCredit } from '@/components/common/DeveloperCredit';
import { usePWAInstall, usePWAPromptEligibility } from '@/hooks/usePWAInstall';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import logoIcon from '@/assets/logo-icon.png';
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
  CalendarClock,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

const navItems = [
  { key: 'nav.dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'nav.members', label: 'Members', labelBn: 'সদস্য', icon: Users, href: '/dashboard/members' },
  { key: 'nav.payments', label: 'Payments', labelBn: 'পেমেন্ট', icon: CreditCard, href: '/dashboard/payments' },
  { key: 'nav.dues', label: 'Dues', labelBn: 'বকেয়া', icon: CalendarClock, href: '/dashboard/dues' },
  { key: 'nav.reports', label: 'Reports', labelBn: 'রিপোর্ট', icon: FileBarChart, href: '/dashboard/reports', requiredRole: 'admin' },
  { key: 'nav.notices', label: 'Notices', labelBn: 'নোটিশ', icon: Bell, href: '/dashboard/notices' },
  { key: 'nav.constitution', label: 'Constitution', labelBn: 'সংবিধান', icon: BookOpen, href: '/dashboard/constitution' },
  { key: 'nav.settings', label: 'Settings', labelBn: 'সেটিংস', icon: Settings, href: '/dashboard/settings', requiredRole: 'admin' },
];

// Bottom nav items (max 5) - Admin/Manager
const bottomNavItems: BottomNavItem[] = [
  { key: 'nav.dashboard', label: 'Home', labelBn: 'হোম', icon: LayoutDashboard, href: '/dashboard', end: true },
  { key: 'nav.members', label: 'Members', labelBn: 'সদস্য', icon: Users, href: '/dashboard/members' },
  { key: 'nav.payments', label: 'Payments', labelBn: 'পেমেন্ট', icon: CreditCard, href: '/dashboard/payments' },
  { key: 'nav.dues', label: 'Dues', labelBn: 'বকেয়া', icon: CalendarClock, href: '/dashboard/dues' },
  { key: 'nav.more', label: 'More', labelBn: 'আরও', icon: MoreHorizontal, href: '/dashboard/settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// PWA Install Prompt Wrapper for logged-in users
function PWAInstallPromptWrapper() {
  const location = useLocation();
  const isEligible = usePWAPromptEligibility(location.pathname);
  const { isPromptVisible, installApp, dismissForNow } = usePWAInstall(true); // Always logged in inside dashboard

  if (!isEligible) return null;

  return (
    <PWAInstallPrompt
      isVisible={isPromptVisible}
      onInstall={installApp}
      onDismiss={dismissForNow}
    />
  );
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { t, language } = useLanguage();
  const { tenant, isLoading, isSubscriptionValid, checkPermission, error, isSuperAdmin } = useTenant();
  const { isImpersonating, target: impersonationTarget } = useImpersonation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Use impersonation tenant info when active
  const displayTenantName = isImpersonating && impersonationTarget?.type === 'tenant_admin' 
    ? impersonationTarget.tenantName 
    : tenant?.name || 'Your Organization';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      toast({
        title: t('auth.logoutSuccess') || 'Logged out',
        description: t('auth.logoutMessage') || 'You have been successfully logged out',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filter nav items based on user role
  const filteredNavItems = useMemo(() => navItems.filter(item => {
    if (!item.requiredRole) return true;
    return isSuperAdmin || checkPermission(item.requiredRole);
  }), [isSuperAdmin, checkPermission]);

  // Check if we should hide bottom nav (full-screen forms, modals, etc.)
  const hideBottomNav = useMemo(() => {
    // Hide on payment redirect pages
    const hideRoutes = ['/dashboard/payment-success', '/dashboard/payment-cancelled'];
    return hideRoutes.some(route => location.pathname.startsWith(route));
  }, [location.pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading your dashboard...'}
          </p>
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
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {language === 'bn' ? 'প্রবেশ সীমিত' : 'Access Restricted'}
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const subscriptionStatus = isSubscriptionValid ? 'Active' : 'Expired';

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* SEO - Prevent indexing of dashboard pages */}
      <NoIndexSEO title="Dashboard" />
      
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
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

        {/* Sidebar - Hidden on mobile, visible on desktop */}
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
                <img src={logoIcon} alt="Somiti" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-lg font-bold text-sidebar-foreground">Somiti</span>
              </div>
            )}
            {collapsed && (
              <img src={logoIcon} alt="Somiti" className="mx-auto h-8 w-8 rounded-lg object-contain" />
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
                end={item.href === '/dashboard'}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-bengali">{language === 'bn' ? item.labelBn : item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
                collapsed && "justify-center px-2"
              )}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5 flex-shrink-0" />
              )}
              {!collapsed && <span>{isLoggingOut ? (language === 'bn' ? 'লগআউট হচ্ছে...' : 'Logging out...') : (language === 'bn' ? 'লগআউট' : t('auth.logout'))}</span>}
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top header */}
          <header className="flex h-14 lg:h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-foreground font-bengali">
                  {language === 'bn' ? 'স্বাগতম' : t('dashboard.welcome')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {displayTenantName} • {subscriptionStatus}
                </p>
              </div>
              {/* Mobile title */}
              <div className="lg:hidden">
                <span className="font-semibold text-foreground font-bengali">{displayTenantName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <NotificationCenter />
              <LanguageToggle />
              <div className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {displayTenantName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Page content with error boundary */}
          <main className={cn(
            "flex-1 overflow-auto bg-background p-4 lg:p-6",
            // Add bottom padding for mobile nav
            !hideBottomNav && "pb-bottom-nav lg:pb-6"
          )}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          {/* Developer Credit - Hidden on mobile to avoid overlap with bottom nav */}
          <DeveloperCredit className="hidden lg:block" />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && <MobileBottomNav items={bottomNavItems} />}
      
      {/* PWA Install Prompt */}
      <PWAInstallPromptWrapper />
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
