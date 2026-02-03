import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant, TenantProvider } from '@/contexts/TenantContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
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
import {
  Home,
  CreditCard,
  Receipt,
  Bell,
  BookOpen,
  LogOut,
  Menu,
  X,
  Loader2,
  Shield,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

const navItems = [
  { key: 'member.dashboard', label: 'My Dashboard', labelBn: 'আমার ড্যাশবোর্ড', icon: Home, href: '/member' },
  { key: 'member.payments', label: 'My Payments', labelBn: 'আমার পেমেন্ট', icon: CreditCard, href: '/member/payments' },
  { key: 'member.dues', label: 'My Dues', labelBn: 'আমার বকেয়া', icon: Receipt, href: '/member/dues' },
  { key: 'member.notices', label: 'Notices', labelBn: 'নোটিশ', icon: Bell, href: '/member/notices' },
  { key: 'member.constitution', label: 'Constitution', labelBn: 'সংবিধান', icon: BookOpen, href: '/member/constitution' },
];

// Bottom nav items for member portal (max 5)
const bottomNavItems: BottomNavItem[] = [
  { key: 'member.dashboard', label: 'Home', labelBn: 'হোম', icon: Home, href: '/member', end: true },
  { key: 'member.payments', label: 'Payments', labelBn: 'পেমেন্ট', icon: CreditCard, href: '/member/payments' },
  { key: 'member.dues', label: 'Dues', labelBn: 'বকেয়া', icon: Receipt, href: '/member/dues' },
  { key: 'member.notices', label: 'Notices', labelBn: 'নোটিশ', icon: Bell, href: '/member/notices' },
  { key: 'member.constitution', label: 'More', labelBn: 'আরও', icon: BookOpen, href: '/member/constitution' },
];

interface MemberLayoutProps {
  children: React.ReactNode;
}

// PWA Install Prompt Wrapper for member portal
function MemberPWAInstallPromptWrapper() {
  const location = useLocation();
  const isEligible = usePWAPromptEligibility(location.pathname);
  const { isPromptVisible, installApp, dismissForNow } = usePWAInstall(true);

  if (!isEligible) return null;

  return (
    <PWAInstallPrompt
      isVisible={isPromptVisible}
      onInstall={installApp}
      onDismiss={dismissForNow}
    />
  );
}

function MemberLayoutContent({ children }: MemberLayoutProps) {
  const { language } = useLanguage();
  const { tenant, isLoading, error, isMember } = useTenant();
  const { isImpersonating, target: impersonationTarget } = useImpersonation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // When impersonating as member, skip auth checks and show member portal
  const isViewingAsMember = isImpersonating && impersonationTarget?.type === 'member';

  // Check if we should hide bottom nav (full-screen forms, payment pages)
  const hideBottomNav = useMemo(() => {
    const hideRoutes = ['/member/payment-redirect'];
    return hideRoutes.some(route => location.pathname.startsWith(route));
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      toast({
        title: language === 'bn' ? 'লগআউট সফল' : 'Logged out',
        description: language === 'bn' ? 'আপনি সফলভাবে লগআউট করেছেন' : 'You have been successfully logged out',
      });
      navigate('/member/login');
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading your portal...'}
          </p>
        </div>
      </div>
    );
  }

  // Error/access denied state (skip if impersonating)
  if ((error || !isMember) && !isViewingAsMember) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {language === 'bn' ? 'প্রবেশাধিকার নেই' : 'Access Restricted'}
          </h1>
          <p className="text-muted-foreground">
            {error || (language === 'bn' 
              ? 'এই পোর্টালে প্রবেশের অনুমতি নেই।' 
              : 'You do not have permission to access this portal.')}
          </p>
        </div>
      </div>
    );
  }

  const tenantName = isViewingAsMember && impersonationTarget?.tenantName 
    ? impersonationTarget.tenantName 
    : (language === 'bn' && tenant?.name_bn ? tenant.name_bn : tenant?.name || 'Somiti');

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* SEO - Prevent indexing of member pages */}
      <NoIndexSEO title="Member Portal" />
      
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
      {/* Mobile Header - Simplified for bottom nav */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-lg px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground font-bengali truncate max-w-[150px]">{tenantName}</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationCenter />
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Drawer - Now for logout/settings only */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="fixed top-14 left-0 right-0 z-50 border-b border-border bg-card p-4 lg:hidden animate-slide-up">
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-foreground/80 transition-colors active:bg-muted/70"
                  activeClassName="bg-primary/10 text-primary"
                  onClick={() => setMobileOpen(false)}
                  end={item.href === '/member'}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-bengali">{language === 'bn' ? item.labelBn : item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-destructive transition-colors active:bg-destructive/10 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                <span>{isLoggingOut ? (language === 'bn' ? 'লগআউট হচ্ছে...' : 'Logging out...') : (language === 'bn' ? 'লগআউট' : 'Logout')}</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
          {/* Logo/Tenant */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate font-bengali">{tenantName}</p>
              <p className="text-xs text-muted-foreground">
                {language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground/70 transition-all hover:bg-muted hover:text-foreground"
                activeClassName="bg-primary/10 text-primary font-semibold"
                end={item.href === '/member'}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-bengali">{language === 'bn' ? item.labelBn : item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground">
                {language === 'bn' ? 'ভাষা' : 'Language'}
              </span>
              <LanguageToggle />
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              <span>{isLoggingOut ? (language === 'bn' ? 'লগআউট হচ্ছে...' : 'Logging out...') : (language === 'bn' ? 'লগআউট' : 'Logout')}</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-auto",
          // Add bottom padding for mobile nav
          !hideBottomNav && "pb-bottom-nav lg:pb-0"
        )}>
          <div className="container max-w-5xl mx-auto p-4 lg:p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
        
        {/* Developer Credit - Hidden on mobile to avoid overlap with bottom nav */}
        <DeveloperCredit className="hidden lg:block" />
      </div>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && <MobileBottomNav items={bottomNavItems} />}
      
      {/* PWA Install Prompt */}
      <MemberPWAInstallPromptWrapper />
    </div>
  );
}

export function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <TenantProvider>
      <MemberLayoutContent>{children}</MemberLayoutContent>
    </TenantProvider>
  );
}
