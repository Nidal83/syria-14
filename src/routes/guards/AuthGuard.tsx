/**
 * AuthGuard — redirects unauthenticated users to /login.
 * Preserves the intended destination so the user lands there after login.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { PATHS } from '../paths';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
}

export function AuthGuard({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
