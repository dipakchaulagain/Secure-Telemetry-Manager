import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/login";
import ChangePasswordPage from "@/pages/change-password";
import DashboardPage from "@/pages/dashboard";
import ActiveSessionsPage from "@/pages/active-sessions";
import VpnUsersPage from "@/pages/vpn-users";
import VpnUserDetailsPage from "@/pages/vpn-user-details";
import PortalUsersPage from "@/pages/portal-users";
import AuditLogsPage from "@/pages/audit-logs";
import AccountingPage from "@/pages/accounting";
import VpnServersPage from "@/pages/vpn-servers";
import NotFound from "@/pages/not-found";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  // Force password change redirect
  if (user.mustChangePassword) {
    setLocation("/change-password");
    return null;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/change-password" component={ChangePasswordPage} />

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/sessions">
        <ProtectedRoute component={ActiveSessionsPage} />
      </Route>
      <Route path="/vpn-users/:id">
        <ProtectedRoute component={VpnUserDetailsPage} />
      </Route>
      <Route path="/vpn-users">
        <ProtectedRoute component={VpnUsersPage} />
      </Route>
      <Route path="/accounting">
        <ProtectedRoute component={AccountingPage} />
      </Route>
      <Route path="/portal-users">
        <ProtectedRoute component={PortalUsersPage} />
      </Route>
      <Route path="/vpn-servers">
        <ProtectedRoute component={VpnServersPage} />
      </Route>
      <Route path="/audit">
        <ProtectedRoute component={AuditLogsPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
