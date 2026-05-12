import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProviders } from '@/app/AppProviders';
import { AppRouter } from '@/app/AppRouter';

const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </ErrorBoundary>
);

export default App;
