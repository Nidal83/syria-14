/**
 * Centralized route path constants.
 * Never hardcode path strings in components — always import from here.
 */

export const PATHS = {
  // Public
  home: '/',
  properties: '/properties',
  propertyDetail: (slug: string) => `/properties/${slug}`,
  search: '/search',
  offices: '/offices',
  officeDetail: (slug: string) => `/offices/${slug}`,
  contact: '/contact',

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // User (authenticated)
  account: '/account',
  accountProfile: '/account/profile',
  accountFavorites: '/account/favorites',
  accountMessages: '/account/messages',
  favorites: '/favorites',

  // Pending office
  officeApply: '/office/apply',
  officeApplicationStatus: '/office/application-status',

  // Office dashboard
  officeDashboard: '/office/dashboard',
  officeProperties: '/office/properties',
  officeNewProperty: '/office/properties/new',
  officeEditProperty: (id: string) => `/office/properties/${id}/edit`,
  officeProfile: '/office/profile',
  officeMessages: '/office/messages',
  officeSettings: '/office/settings',

  // Admin (non-public)
  adminPanel: '/control-panel',
  adminDashboard: '/control-panel/dashboard',
  adminUsers: '/control-panel/users',
  adminOffices: '/control-panel/offices',
  adminProperties: '/control-panel/properties',
  adminApplications: '/control-panel/office-applications',
} as const;
