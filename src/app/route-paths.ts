/**
 * Centralized route paths.
 *
 * The single source of truth for every URL the app routes to. Anything that
 * builds a route should `import { ROUTES } from '@/app/route-paths'` —
 * never hardcode `/admin`, `/property/123`, etc.
 *
 * `*` paths are functions for parameterized routes.
 */

export const ROUTES = {
  // Public
  home: '/',
  search: '/search',
  property: (id: string) => `/property/${id}`,
  propertyPattern: '/property/:id',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',

  // Auth
  login: '/login',
  register: '/register',
  adminLogin: '/admin-login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',

  // User
  favorites: '/favorites',
  dashboard: '/dashboard',

  // Office
  office: '/office',
  officeAddProperty: '/office?action=add-property',

  // Admin
  admin: '/admin',

  // Fallback
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * The right dashboard URL for a given role.
 * One place to change if we ever rename or add roles.
 */
export function getDashboardPath(role: 'guest' | 'user' | 'office' | 'admin'): string {
  switch (role) {
    case 'admin':
      return ROUTES.admin;
    case 'office':
      return ROUTES.office;
    case 'user':
      return ROUTES.dashboard;
    default:
      return ROUTES.login;
  }
}
