import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/app/route-paths';
import { Loader2 } from 'lucide-react';

/**
 * Route element that sends the user to the dashboard appropriate for their role.
 *   admin   → /admin
 *   office  → /office
 *   user    → /dashboard (default user dashboard)
 *   guest   → /login
 *
 * Use this as the element for `/dashboard` when you want one URL that
 * always lands the user in the right place.
 */
export function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (user.role === 'admin') return <Navigate to={ROUTES.admin} replace />;
  if (user.role === 'office') return <Navigate to={ROUTES.office} replace />;
  return <Navigate to={ROUTES.dashboard} replace />;
}
