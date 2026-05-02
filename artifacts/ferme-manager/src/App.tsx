import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Animaux from "@/pages/animaux";
import Sante from "@/pages/sante";
import Reproduction from "@/pages/reproduction";
import Alimentation from "@/pages/alimentation";
import Loges from "@/pages/loges";
import Maintenance from "@/pages/maintenance";
import Employes from "@/pages/employes";
import Veterinaire from "@/pages/veterinaire";
import Fournisseurs from "@/pages/fournisseurs";
import Budget from "@/pages/budget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) {
    return <Login />;
  }

  if (adminOnly && role !== "admin") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center py-20">
          <h2 className="text-2xl font-bold text-destructive mb-2">Accès Refusé</h2>
          <p className="text-muted-foreground">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/animaux">{() => <ProtectedRoute component={Animaux} />}</Route>
      <Route path="/sante">{() => <ProtectedRoute component={Sante} />}</Route>
      <Route path="/reproduction">{() => <ProtectedRoute component={Reproduction} />}</Route>
      <Route path="/alimentation">{() => <ProtectedRoute component={Alimentation} />}</Route>
      <Route path="/loges">{() => <ProtectedRoute component={Loges} />}</Route>
      <Route path="/maintenance">{() => <ProtectedRoute component={Maintenance} />}</Route>
      <Route path="/employes">{() => <ProtectedRoute component={Employes} />}</Route>
      <Route path="/veterinaire">{() => <ProtectedRoute component={Veterinaire} />}</Route>
      <Route path="/fournisseurs">{() => <ProtectedRoute component={Fournisseurs} />}</Route>
      <Route path="/budget">{() => <ProtectedRoute component={Budget} adminOnly />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
