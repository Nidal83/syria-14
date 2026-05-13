/**
 * RoleGuard — restricts a route to users with specific roles.
 * Authenticated users who lack the required role are redirected to their appropriate page.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { isAdmin, isOffice, isPendingOffice } from '@/lib/roles';
import type { UserRole } from '@/types/roles.types';
import { PATHS } from '../paths';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Props {
  children: React.ReactNode;
  /** One or more roles that are allowed to access this route. */
  roles: UserRole[];
}

export function RoleGuard({ children, roles }: Props) {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated || !profile) {
    return <Navigate to={PATHS.login} replace />;
  }

  if (!roles.includes(profile.role)) {
    // Redirect to the correct dashboard for the user's actual role
    if (isAdmin(profile)) return <Navigate to={PATHS.adminDashboard} replace />;
    if (isOffice(profile)) return <Navigate to={PATHS.officeDashboard} replace />;
    if (isPendingOffice(profile)) return <Navigate to={PATHS.officeApplicationStatus} replace />;
    return <Navigate to={PATHS.home} replace />;
  }

  return <>{children}</>;
}
