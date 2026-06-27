import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SpirometryPage from "@/pages/SpirometryPage";
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import ClinicianPage from "@/pages/ClinicianPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import EducationPage from "@/pages/EducationPage";
import ChatbotPage from "@/pages/ChatbotPage";
import ProfilePage from "@/pages/ProfilePage";
import CalculatorPage from "@/pages/CalculatorPage";
import FamilyPage from "@/pages/FamilyPage";
import NavigationShell from "@/components/NavigationShell";
import React from "react";
import { checkAndFireReminder } from "@/lib/storage";
import { ThemeProvider } from "@/lib/theme";

const queryClient = new QueryClient();

// Fire any pending reminder on every app load
checkAndFireReminder();

function Router() {
  return (
    <Switch>
      {/* App Portal Pages (Wrapped in responsive NavigationShell) */}
      <Route path="/">
        {() => (
          <NavigationShell>
            <LandingPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/test">
        {() => (
          <NavigationShell>
            <SpirometryPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/dashboard">
        {() => (
          <NavigationShell>
            <DashboardPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/clinician">
        {() => (
          <NavigationShell>
            <ClinicianPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/clinician/patient/:id">
        {(params) => (
          <NavigationShell>
            <PatientDetailPage id={params.id} />
          </NavigationShell>
        )}
      </Route>

      <Route path="/education">
        {() => (
          <NavigationShell>
            <EducationPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/chat">
        {() => (
          <NavigationShell>
            <ChatbotPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/profile">
        {() => (
          <NavigationShell>
            <ProfilePage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/calculator">
        {() => (
          <NavigationShell>
            <CalculatorPage />
          </NavigationShell>
        )}
      </Route>

      <Route path="/family">
        {() => (
          <NavigationShell>
            <FamilyPage />
          </NavigationShell>
        )}
      </Route>

      {/* 404 Fallback */}
      <Route>
        {() => (
          <NavigationShell>
            <NotFound />
          </NavigationShell>
        )}
      </Route>
    </Switch>
  );
}

// Custom hook to support hash routing in wouter
const useHashLocation = () => {
  const [loc, setLoc] = React.useState(
    () => window.location.hash.replace(/^#/, "") || "/"
  );

  React.useEffect(() => {
    const handler = () => {
      setLoc(window.location.hash.replace(/^#/, "") || "/");
    };

    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = React.useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [loc, navigate] as [string, (to: string) => void];
};

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter hook={useHashLocation}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
