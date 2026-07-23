import React from 'react';
import { QueryProvider } from './providers/QueryProvider';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';

export const AppContent: React.FC = () => {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
};

export default App;
