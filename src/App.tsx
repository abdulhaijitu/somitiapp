import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AnalyticsProvider, AnalyticsSetup } from "@/components/common/Analytics";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import { RequireSuperAdmin } from "@/components/super-admin/RequireSuperAdmin";
import { RequireTenantAuth } from "@/components/tenant/RequireTenantAuth";
import { RequireMemberAuth } from "@/components/member/RequireMemberAuth";
import { Loader2 } from "lucide-react";

// Lazy-loaded page components for code splitting
const DashboardOverview = lazy(() => import("@/pages/dashboard/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const MembersPage = lazy(() => import("@/pages/dashboard/MembersPage").then(m => ({ default: m.MembersPage })));
const PaymentsPage = lazy(() => import("@/pages/dashboard/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const PaymentSuccessPage = lazy(() => import("@/pages/dashboard/PaymentSuccessPage").then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelledPage = lazy(() => import("@/pages/dashboard/PaymentCancelledPage").then(m => ({ default: m.PaymentCancelledPage })));
const ReportsPage = lazy(() => import("@/pages/dashboard/ReportsPage").then(m => ({ default: m.ReportsPage })));
const NoticesPage = lazy(() => import("@/pages/dashboard/NoticesPage").then(m => ({ default: m.NoticesPage })));
const ConstitutionPage = lazy(() => import("@/pages/dashboard/ConstitutionPage").then(m => ({ default: m.ConstitutionPage })));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage").then(m => ({ default: m.SettingsPage })));
const DuesPage = lazy(() => import("@/pages/dashboard/DuesPage").then(m => ({ default: m.DuesPage })));

const SuperAdminDashboard = lazy(() => import("@/pages/super-admin/SuperAdminDashboard").then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminLoginPage = lazy(() => import("@/pages/super-admin/SuperAdminLoginPage").then(m => ({ default: m.SuperAdminLoginPage })));
const TenantsManagementPage = lazy(() => import("@/pages/super-admin/TenantsManagementPage").then(m => ({ default: m.TenantsManagementPage })));
const SubscriptionsManagementPage = lazy(() => import("@/pages/super-admin/SubscriptionsManagementPage").then(m => ({ default: m.SubscriptionsManagementPage })));
const AuditLogsPage = lazy(() => import("@/pages/super-admin/AuditLogsPage").then(m => ({ default: m.AuditLogsPage })));
const SuperAdminSettingsPage = lazy(() => import("@/pages/super-admin/SuperAdminSettingsPage").then(m => ({ default: m.SuperAdminSettingsPage })));
const SystemMonitoringPage = lazy(() => import("@/pages/super-admin/SystemMonitoringPage").then(m => ({ default: m.SystemMonitoringPage })));
const RevenueDashboardPage = lazy(() => import("@/pages/super-admin/RevenueDashboardPage").then(m => ({ default: m.RevenueDashboardPage })));

const MemberDashboard = lazy(() => import("@/pages/member/MemberDashboard").then(m => ({ default: m.MemberDashboard })));
const MemberPaymentsPage = lazy(() => import("@/pages/member/MemberPaymentsPage").then(m => ({ default: m.MemberPaymentsPage })));
const MemberDuesPage = lazy(() => import("@/pages/member/MemberDuesPage").then(m => ({ default: m.MemberDuesPage })));
const MemberNoticesPage = lazy(() => import("@/pages/member/MemberNoticesPage").then(m => ({ default: m.MemberNoticesPage })));
const MemberConstitutionPage = lazy(() => import("@/pages/member/MemberConstitutionPage").then(m => ({ default: m.MemberConstitutionPage })));
const MemberLoginPage = lazy(() => import("@/pages/member/MemberLoginPage").then(m => ({ default: m.MemberLoginPage })));

const TenantLoginPage = lazy(() => import("@/pages/tenant/TenantLoginPage").then(m => ({ default: m.TenantLoginPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/tenant/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/tenant/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));

const TermsOfServicePage = lazy(() => import("@/pages/legal/TermsOfServicePage").then(m => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazy(() => import("@/pages/legal/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const PitchDeckPage = lazy(() => import("@/pages/PitchDeckPage").then(m => ({ default: m.PitchDeckPage })));
const MobileRoadmapPage = lazy(() => import("@/pages/MobileRoadmapPage").then(m => ({ default: m.MobileRoadmapPage })));
const PricingPage = lazy(() => import("@/pages/public/PricingPage").then(m => ({ default: m.PricingPage })));
const AboutPage = lazy(() => import("@/pages/public/AboutPage").then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("@/pages/public/ContactPage").then(m => ({ default: m.ContactPage })));
const InstallAppPage = lazy(() => import("@/pages/public/InstallAppPage").then(m => ({ default: m.InstallAppPage })));

// Optimized QueryClient with stale/cache config to reduce refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Suspense fallback for lazy routes
function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

// Persistent layout wrappers using Outlet — mounted ONCE, child pages swap via Outlet
function DashboardWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <TenantProvider>
          <RequireTenantAuth>
            <DashboardLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </DashboardLayout>
          </RequireTenantAuth>
        </TenantProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function SuperAdminWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <TenantProvider>
          <RequireSuperAdmin>
            <SuperAdminLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </SuperAdminLayout>
          </RequireSuperAdmin>
        </TenantProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function MemberWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <TenantProvider>
          <RequireMemberAuth>
            <MemberLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MemberLayout>
          </RequireMemberAuth>
        </TenantProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function PublicWrapper() {
  return (
    <LanguageProvider>
      <PublicLayout>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </PublicLayout>
    </LanguageProvider>
  );
}

function LangWrapper() {
  return (
    <LanguageProvider>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </LanguageProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ImpersonationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsProvider>
            <AnalyticsSetup />
            <Routes>
              {/* Home */}
              <Route path="/" element={<Index />} />
              
              {/* Public Pages with shared layout */}
              <Route element={<PublicWrapper />}>
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/install" element={<InstallAppPage />} />
              </Route>
          
              {/* Pages that only need LanguageProvider */}
              <Route element={<LangWrapper />}>
                <Route path="/login" element={<TenantLoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/member/login" element={<MemberLoginPage />} />
                <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
                <Route path="/dashboard/payments/success" element={<PaymentSuccessPage />} />
                <Route path="/dashboard/payments/cancelled" element={<PaymentCancelledPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/pitch" element={<PitchDeckPage />} />
                <Route path="/mobile-roadmap" element={<MobileRoadmapPage />} />
              </Route>
          
              {/* Tenant Dashboard routes (protected) — layout mounted ONCE */}
              <Route element={<DashboardWrapper />}>
                <Route path="/dashboard" element={<DashboardOverview />} />
                <Route path="/dashboard/members" element={<MembersPage />} />
                <Route path="/dashboard/payments" element={<PaymentsPage />} />
                <Route path="/dashboard/reports" element={<ReportsPage />} />
                <Route path="/dashboard/notices" element={<NoticesPage />} />
                <Route path="/dashboard/constitution" element={<ConstitutionPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route path="/dashboard/dues" element={<DuesPage />} />
              </Route>
          
              {/* Member Portal routes (protected) — layout mounted ONCE */}
              <Route element={<MemberWrapper />}>
                <Route path="/member" element={<MemberDashboard />} />
                <Route path="/member/payments" element={<MemberPaymentsPage />} />
                <Route path="/member/dues" element={<MemberDuesPage />} />
                <Route path="/member/notices" element={<MemberNoticesPage />} />
                <Route path="/member/constitution" element={<MemberConstitutionPage />} />
              </Route>
          
              {/* Super Admin routes (protected) — layout mounted ONCE */}
              <Route element={<SuperAdminWrapper />}>
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/tenants" element={<TenantsManagementPage />} />
                <Route path="/super-admin/subscriptions" element={<SubscriptionsManagementPage />} />
                <Route path="/super-admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
                <Route path="/super-admin/monitoring" element={<SystemMonitoringPage />} />
                <Route path="/super-admin/revenue" element={<RevenueDashboardPage />} />
              </Route>
          
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsentBanner />
          </AnalyticsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ImpersonationProvider>
  </QueryClientProvider>
);

export default App;