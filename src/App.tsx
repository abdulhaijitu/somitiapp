import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DashboardOverview } from "@/pages/dashboard/DashboardOverview";
import { MembersPage } from "@/pages/dashboard/MembersPage";
import { PaymentsPage } from "@/pages/dashboard/PaymentsPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { NoticesPage } from "@/pages/dashboard/NoticesPage";
import { ConstitutionPage } from "@/pages/dashboard/ConstitutionPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";

const queryClient = new QueryClient();

// Dashboard wrapper component
function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardLayout>{children}</DashboardLayout>
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
          
          {/* Dashboard routes */}
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
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
