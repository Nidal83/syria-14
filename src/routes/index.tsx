import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { GuestGuard } from './guards/GuestGuard';
import { RoleGuard } from './guards/RoleGuard';
import { PATHS } from './paths';
import { PageLayout } from '@/components/layout/PageLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// ── Lazy-load all pages for code splitting ────────────────────────────────────
// Public
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const PropertiesPage = lazy(() => import('@/pages/public/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/pages/public/PropertyDetailPage'));
const SearchPage = lazy(() => import('@/pages/public/SearchPage'));
const OfficesPage = lazy(() => import('@/pages/public/OfficesPage'));
const OfficeDetailPage = lazy(() => import('@/pages/public/OfficeDetailPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// User
const AccountPage = lazy(() => import('@/pages/user/AccountPage'));
const FavoritesPage = lazy(() => import('@/pages/user/FavoritesPage'));
const ApplyAsOfficePage = lazy(() => import('@/pages/user/ApplyAsOfficePage'));

// Pending office
const ApplicationStatusPage = lazy(() => import('@/pages/pending-office/ApplicationStatusPage'));

// Office dashboard
const OfficeDashboardPage = lazy(() => import('@/pages/office/DashboardPage'));
const OfficePropertiesPage = lazy(() => import('@/pages/office/PropertiesPage'));
const NewPropertyPage = lazy(() => import('@/pages/office/NewPropertyPage'));
const EditPropertyPage = lazy(() => import('@/pages/office/EditPropertyPage'));
const OfficeProfilePage = lazy(() => import('@/pages/office/ProfilePage'));
const OfficeSettingsPage = lazy(() => import('@/pages/office/SettingsPage'));

// Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const AdminOfficesPage = lazy(() => import('@/pages/admin/OfficesPage'));
const AdminPropertiesPage = lazy(() => import('@/pages/admin/PropertiesPage'));
const AdminApplicationsPage = lazy(() => import('@/pages/admin/ApplicationsPage'));

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ── Suspense wrapper ──────────────────────────────────────────────────────────
function SuspenseRoute() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Outlet />
    </Suspense>
  );
}

// ── Router definition ─────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    element: <SuspenseRoute />,
    children: [
      // ── Public routes (accessible without auth) ───────────────────────────
      {
        element: <PageLayout />,
        children: [
          { path: PATHS.home, element: <HomePage /> },
          { path: PATHS.properties, element: <PropertiesPage /> },
          { path: '/properties/:slug', element: <PropertyDetailPage /> },
          { path: PATHS.search, element: <SearchPage /> },
          { path: PATHS.offices, element: <OfficesPage /> },
          { path: '/offices/:slug', element: <OfficeDetailPage /> },
          { path: PATHS.contact, element: <ContactPage /> },
          { path: PATHS.favorites, element: <FavoritesPage /> },
        ],
      },

      // ── Auth routes (guests only) ─────────────────────────────────────────
      {
        element: (
          <GuestGuard>
            <SuspenseRoute />
          </GuestGuard>
        ),
        children: [
          { path: PATHS.login, element: <LoginPage /> },
          { path: PATHS.register, element: <RegisterPage /> },
          { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
          { path: PATHS.resetPassword, element: <ResetPasswordPage /> },
        ],
      },

      // ── Authenticated user routes ─────────────────────────────────────────
      {
        element: (
          <AuthGuard>
            <PageLayout />
          </AuthGuard>
        ),
        children: [
          { path: PATHS.account, element: <AccountPage /> },
          { path: PATHS.accountFavorites, element: <FavoritesPage /> },
          { path: PATHS.officeApply, element: <ApplyAsOfficePage /> },
        ],
      },

      // ── Pending office routes ─────────────────────────────────────────────
      {
        element: (
          <AuthGuard>
            <RoleGuard roles={['pending_office']}>
              <PageLayout />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [{ path: PATHS.officeApplicationStatus, element: <ApplicationStatusPage /> }],
      },

      // ── Office dashboard routes ───────────────────────────────────────────
      {
        element: (
          <AuthGuard>
            <RoleGuard roles={['office', 'admin']}>
              <DashboardLayout role="office" />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [
          { path: PATHS.officeDashboard, element: <OfficeDashboardPage /> },
          { path: PATHS.officeProperties, element: <OfficePropertiesPage /> },
          { path: PATHS.officeNewProperty, element: <NewPropertyPage /> },
          { path: '/office/properties/:id/edit', element: <EditPropertyPage /> },
          { path: PATHS.officeProfile, element: <OfficeProfilePage /> },
          { path: PATHS.officeSettings, element: <OfficeSettingsPage /> },
        ],
      },

      // ── Admin control panel ───────────────────────────────────────────────
      {
        element: (
          <AuthGuard>
            <RoleGuard roles={['admin']}>
              <DashboardLayout role="admin" />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [
          { path: PATHS.adminPanel, element: <AdminDashboardPage /> },
          { path: PATHS.adminDashboard, element: <AdminDashboardPage /> },
          { path: PATHS.adminUsers, element: <AdminUsersPage /> },
          { path: PATHS.adminOffices, element: <AdminOfficesPage /> },
          { path: PATHS.adminProperties, element: <AdminPropertiesPage /> },
          { path: PATHS.adminApplications, element: <AdminApplicationsPage /> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────────
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
