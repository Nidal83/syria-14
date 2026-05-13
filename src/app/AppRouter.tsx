import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from '@/components/Layout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { RoleRedirect } from '@/features/auth/components/RoleRedirect';
import { ROUTES } from '@/app/route-paths';

// Lazy-loaded pages.
// Each one becomes its own JS chunk, fetched only when the route is visited.
// Guests no longer pay the cost of admin/office dashboard code.
const Index = lazy(() => import('@/pages/Index'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const PropertyDetails = lazy(() => import('@/pages/PropertyDetails'));
const Login = lazy(() => import('@/pages/Login'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const OfficeDashboard = lazy(() => import('@/pages/OfficeDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Contact = lazy(() => import('@/pages/Contact'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout wraps every page — Header, Footer, Suspense fallback. */}
        <Route element={<Layout />}>
          {/* Public */}
          <Route path={ROUTES.home} element={<Index />} />
          <Route path={ROUTES.search} element={<SearchResults />} />
          <Route path={ROUTES.propertyPattern} element={<PropertyDetails />} />
          <Route path={ROUTES.contact} element={<Contact />} />
          <Route path={ROUTES.terms} element={<Terms />} />
          <Route path={ROUTES.privacy} element={<Privacy />} />

          {/* Auth */}
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.adminLogin} element={<AdminLogin />} />
          <Route path={ROUTES.register} element={<Register />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
          <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
          <Route path={ROUTES.verifyEmail} element={<VerifyEmail />} />

          {/* User-scoped */}
          <Route
            path={ROUTES.favorites}
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />

          {/*
            /dashboard is intentionally TWO routes:
            - Top-level redirects whoever lands here to the dashboard that fits
              their role (admin → /admin, office → /office, user → user view).
            - The actual user dashboard lives below as the catch-all when
              the user IS a `user` (the redirect would loop without this
              structure).

            For now we keep /dashboard as the user view directly — admins and
            offices have their own URLs and Header drives them there.
            RoleRedirect remains available for future use.
          */}
          <Route
            path={ROUTES.dashboard}
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Office-scoped */}
          <Route
            path={ROUTES.office}
            element={
              <ProtectedRoute>
                <OfficeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin-scoped */}
          <Route
            path={ROUTES.admin}
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path={ROUTES.notFound} element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Re-export for convenience.
export { RoleRedirect };
