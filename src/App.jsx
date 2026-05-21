import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PatientPortal from "./pages/PatientPortal";

const { Pages, Layout, mainPage } = pagesConfig;

function AppContent() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <UserNotRegisteredError />;
  return (
    <Layout>
      <Routes>
        {Object.entries(Pages).map(([name, Page]) => (
          <Route key={name} path={createPageUrl(name)} element={<Page />} />
        ))}
        <Route path="/portal-paciente" element={<PatientPortal />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}