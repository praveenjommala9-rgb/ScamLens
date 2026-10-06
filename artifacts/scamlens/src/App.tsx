import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { useGetAppConfig } from '@workspace/api-client-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ErrorState, PageLoading } from '@/components/scamlens-ui';
import LandingPage from '@/pages/landing';
import AuthPage from '@/pages/auth';
import DashboardPage from '@/pages/dashboard';
import TrainingPage from '@/pages/training';
import ResultPage from '@/pages/result';
import HistoryPage from '@/pages/history';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 20_000 } },
});

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Protected({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (ready && !session) setLocation('/auth');
  }, [ready, session, setLocation]);
  if (!ready) return <PageLoading label="Restoring secure session" />;
  if (!session) return null;
  return <>{children}</>;
}

function ConfiguredRoutes() {
  const config = useGetAppConfig();
  if (config.isLoading) return <PageLoading label="Preparing ScamLens" />;
  if (config.isError || !config.data?.supabaseUrl || !config.data?.supabasePublishableKey) {
    return <div className="content"><ErrorState title="ScamLens could not start" message="Public authentication configuration is unavailable. Please retry or contact your workspace administrator." onRetry={() => void config.refetch()} /></div>;
  }
  return <AuthProvider url={config.data.supabaseUrl} keyValue={config.data.supabasePublishableKey}>
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/dashboard">{() => <Protected><DashboardPage /></Protected>}</Route>
        <Route path="/training/:sessionId">{() => <Protected><TrainingPage /></Protected>}</Route>
        <Route path="/result/:attemptId">{() => <Protected><ResultPage /></Protected>}</Route>
        <Route path="/history">{() => <Protected><HistoryPage /></Protected>}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  </AuthProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ConfiguredRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;
