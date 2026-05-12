import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { ROUTES } from '@/app/route-paths';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  /**
   * Required roles. If omitted, only authentication is required.
   * If multiple roles are listed, the user must have ANY of them.
   */
  roles?: UserRole[];
  /** Where to send unauthenticated users. Defaults to login. */
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route guard.
 *
 * Usage:
 *   <ProtectedRoute><UserDashboard /></ProtectedRoute>
 *   <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
 *   <ProtectedRoute roles={['office', 'admin']}><OfficeDashboard /></ProtectedRoute>
 *
 * Behaviour:
 * - While auth is loading: render a spinner (avoids flashing the login page).
 * - Not authenticated: redirect to `redirectTo` (default `/login`), preserving
 *   the attempted location in router state so post-login can return there.
 * - Authenticated but wrong role: redirect to home with no error message UI —
 *   the page they wanted simply isn't theirs to see.
 *
 * IMPORTANT: this is the UI guard. The real security boundary is RLS in
 * Postgres. UI hides; RLS refuses.
 */
export function ProtectedRoute({
  roles,
  redirectTo = ROUTES.login,
  children,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}
