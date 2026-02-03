import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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
import { RequireSuperAdmin } from "@/components/super-admin/RequireSuperAdmin";
import { RequireTenantAuth } from "@/components/tenant/RequireTenantAuth";
import { RequireMemberAuth } from "@/components/member/RequireMemberAuth";
import { TenantLoginPage } from "@/pages/tenant/TenantLoginPage";
import { ForgotPasswordPage } from "@/pages/tenant/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/tenant/ResetPasswordPage";

const queryClient = new QueryClient();

// Dashboard wrapper component (with auth protection)
function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RequireTenantAuth>
        <DashboardLayout>{children}</DashboardLayout>
      </RequireTenantAuth>
    </LanguageProvider>
  );
}

// Super Admin wrapper component (with auth protection)
function SuperAdminWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RequireSuperAdmin>
        <SuperAdminLayout>{children}</SuperAdminLayout>
      </RequireSuperAdmin>
    </LanguageProvider>
  );
}

// Member Portal wrapper component (with auth protection)
function MemberWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <RequireMemberAuth>
        <MemberLayout>{children}</MemberLayout>
      </RequireMemberAuth>
    </LanguageProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Tenant Login (public) */}
          <Route
            path="/login"
            element={
              <LanguageProvider>
                <TenantLoginPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <LanguageProvider>
                <ForgotPasswordPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/reset-password"
            element={
              <LanguageProvider>
                <ResetPasswordPage />
              </LanguageProvider>
            }
          />
          
          {/* Tenant Dashboard routes (protected) */}
          
          {/* Tenant Dashboard routes (protected) */}
          <Route
            path="/dashboard"
            element={
              <DashboardWrapper>
                <DashboardOverview />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/members"
            element={
              <DashboardWrapper>
                <MembersPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/payments"
            element={
              <DashboardWrapper>
                <PaymentsPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/payments/success"
            element={
              <LanguageProvider>
                <PaymentSuccessPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/dashboard/payments/cancelled"
            element={
              <LanguageProvider>
                <PaymentCancelledPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/dashboard/reports"
            element={
              <DashboardWrapper>
                <ReportsPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/notices"
            element={
              <DashboardWrapper>
                <NoticesPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/constitution"
            element={
              <DashboardWrapper>
                <ConstitutionPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <DashboardWrapper>
                <SettingsPage />
              </DashboardWrapper>
            }
          />
          <Route
            path="/dashboard/dues"
            element={
              <DashboardWrapper>
                <DuesPage />
              </DashboardWrapper>
            }
          />
          
          {/* Member Login (public) */}
          <Route
            path="/member/login"
            element={
              <LanguageProvider>
                <MemberLoginPage />
              </LanguageProvider>
            }
          />
          
          {/* Member Portal routes (protected) */}
          <Route
            path="/member"
            element={
              <MemberWrapper>
                <MemberDashboard />
              </MemberWrapper>
            }
          />
          <Route
            path="/member/payments"
            element={
              <MemberWrapper>
                <MemberPaymentsPage />
              </MemberWrapper>
            }
          />
          <Route
            path="/member/dues"
            element={
              <MemberWrapper>
                <MemberDuesPage />
              </MemberWrapper>
            }
          />
          <Route
            path="/member/notices"
            element={
              <MemberWrapper>
                <MemberNoticesPage />
              </MemberWrapper>
            }
          />
          <Route
            path="/member/constitution"
            element={
              <MemberWrapper>
                <MemberConstitutionPage />
              </MemberWrapper>
            }
          />
          
          {/* Super Admin Login (public) */}
          <Route
            path="/super-admin/login"
            element={
              <LanguageProvider>
                <SuperAdminLoginPage />
              </LanguageProvider>
            }
          />
          
          {/* Super Admin routes (protected) */}
          <Route
            path="/super-admin"
            element={
              <SuperAdminWrapper>
                <SuperAdminDashboard />
              </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/tenants"
            element={
              <SuperAdminWrapper>
                <TenantsManagementPage />
              </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/subscriptions"
            element={
              <SuperAdminWrapper>
                <SubscriptionsManagementPage />
              </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/audit-logs"
            element={
              <SuperAdminWrapper>
                <AuditLogsPage />
              </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <SuperAdminWrapper>
                <SuperAdminSettingsPage />
          </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/monitoring"
            element={
              <SuperAdminWrapper>
                <SystemMonitoringPage />
              </SuperAdminWrapper>
            }
          />
          <Route
            path="/super-admin/revenue"
            element={
              <SuperAdminWrapper>
                <RevenueDashboardPage />
              </SuperAdminWrapper>
            }
          />
          
          {/* Legal Pages */}
          <Route
            path="/terms"
            element={
              <LanguageProvider>
                <TermsOfServicePage />
              </LanguageProvider>
            }
          />
          <Route
            path="/privacy"
            element={
              <LanguageProvider>
                <PrivacyPolicyPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/pitch"
            element={
              <LanguageProvider>
                <PitchDeckPage />
              </LanguageProvider>
            }
          />
          <Route
            path="/mobile-roadmap"
            element={
              <LanguageProvider>
                <MobileRoadmapPage />
              </LanguageProvider>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
