/**
 * GuestGuard — redirects authenticated users away from auth pages (login/register).
 * Sends them to their dashboard or the intended page they came from.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { isAdmin, isOffice, isPendingOffice } from '@/lib/roles';
import { PATHS } from '../paths';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
}

export function GuestGuard({ children }: Props) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isAuthenticated && profile) {
    if (from && from !== PATHS.login && from !== PATHS.register) {
      return <Navigate to={from} replace />;
    }
    if (isAdmin(profile)) return <Navigate to={PATHS.adminDashboard} replace />;
    if (isOffice(profile)) return <Navigate to={PATHS.officeDashboard} replace />;
    if (isPendingOffice(profile)) return <Navigate to={PATHS.officeApplicationStatus} replace />;
    return <Navigate to={PATHS.home} replace />;
  }

  return <>{children}</>;
}
