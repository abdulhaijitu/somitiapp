import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AnalyticsProvider, AnalyticsSetup } from "@/components/common/Analytics";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview";
import { MembersPage } from "@/pages/dashboard/MembersPage";
import { PaymentsPage } from "@/pages/dashboard/PaymentsPage";
import { PaymentSuccessPage } from "@/pages/dashboard/PaymentSuccessPage";
import { PaymentCancelledPage } from "@/pages/dashboard/PaymentCancelledPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { NoticesPage } from "@/pages/dashboard/NoticesPage";
import { ConstitutionPage } from "@/pages/dashboard/ConstitutionPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { DuesPage } from "@/pages/dashboard/DuesPage";
import { SuperAdminDashboard } from "@/pages/super-admin/SuperAdminDashboard";
import { SuperAdminLoginPage } from "@/pages/super-admin/SuperAdminLoginPage";
import { TenantsManagementPage } from "@/pages/super-admin/TenantsManagementPage";
import { SubscriptionsManagementPage } from "@/pages/super-admin/SubscriptionsManagementPage";
import { AuditLogsPage } from "@/pages/super-admin/AuditLogsPage";
import { SuperAdminSettingsPage } from "@/pages/super-admin/SuperAdminSettingsPage";
import { SystemMonitoringPage } from "@/pages/super-admin/SystemMonitoringPage";
import { RevenueDashboardPage } from "@/pages/super-admin/RevenueDashboardPage";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { MemberPaymentsPage } from "@/pages/member/MemberPaymentsPage";
import { MemberDuesPage } from "@/pages/member/MemberDuesPage";
import { MemberNoticesPage } from "@/pages/member/MemberNoticesPage";
import { MemberConstitutionPage } from "@/pages/member/MemberConstitutionPage";
import { MemberLoginPage } from "@/pages/member/MemberLoginPage";
import { TermsOfServicePage } from "@/pages/legal/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/pages/legal/PrivacyPolicyPage";
import { PitchDeckPage } from "@/pages/PitchDeckPage";
import { MobileRoadmapPage } from "@/pages/MobileRoadmapPage";
import { PricingPage } from "@/pages/public/PricingPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { InstallAppPage } from "@/pages/public/InstallAppPage";
import { RequireSuperAdmin } from "@/components/super-admin/RequireSuperAdmin";
import { RequireTenantAuth } from "@/components/tenant/RequireTenantAuth";
import { RequireMemberAuth } from "@/components/member/RequireMemberAuth";
import { TenantLoginPage } from "@/pages/tenant/TenantLoginPage";
import { ForgotPasswordPage } from "@/pages/tenant/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/tenant/ResetPasswordPage";

const queryClient = new QueryClient();

// Persistent layout wrappers using Outlet — mounted ONCE, child pages swap via Outlet
function DashboardWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <RequireTenantAuth>
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        </RequireTenantAuth>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function SuperAdminWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <RequireSuperAdmin>
          <SuperAdminLayout>
            <Outlet />
          </SuperAdminLayout>
        </RequireSuperAdmin>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function MemberWrapper() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <RequireMemberAuth>
          <MemberLayout>
            <Outlet />
          </MemberLayout>
        </RequireMemberAuth>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

function PublicWrapper() {
  return (
    <LanguageProvider>
      <PublicLayout>
        <Outlet />
      </PublicLayout>
    </LanguageProvider>
  );
}

function LangWrapper() {
  return (
    <LanguageProvider>
      <Outlet />
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
