/**
 * Centralized role helper functions.
 * ALL role checks in the UI must go through these helpers — never compare role strings inline.
 */

import type { UserRole } from '@/types/roles.types';
import type { Profile } from '@/types/user.types';

type RoleSource = UserRole | Profile | null | undefined;

function getRole(src: RoleSource): UserRole | undefined {
  if (!src) return undefined;
  if (typeof src === 'string') return src as UserRole;
  return src.role;
}

export const isAdmin = (src: RoleSource): boolean => getRole(src) === 'admin';

export const isOffice = (src: RoleSource): boolean => getRole(src) === 'office';

export const isPendingOffice = (src: RoleSource): boolean => getRole(src) === 'pending_office';

export const isUser = (src: RoleSource): boolean => getRole(src) === 'user';

export const isAuthenticated = (src: RoleSource): boolean => Boolean(getRole(src));

/** Offices and admins can create properties. */
export const canCreateProperty = (src: RoleSource): boolean => isOffice(src) || isAdmin(src);

/** Only admins can approve/reject applications and moderate content. */
export const canModerate = (src: RoleSource): boolean => isAdmin(src);

/** Only admins can manage user roles and accounts. */
export const canManageUsers = (src: RoleSource): boolean => isAdmin(src);

/** Offices and admins have access to the office dashboard. */
export const hasOfficeDashboard = (src: RoleSource): boolean => isOffice(src) || isAdmin(src);

/** Pending applicants have access to the application-status page. */
export const hasPendingOfficePage = (src: RoleSource): boolean => isPendingOffice(src);

/** Check if a role meets a minimum privilege level. */
export const hasMinRole = (src: RoleSource, min: UserRole): boolean => {
  const HIERARCHY: UserRole[] = ['user', 'pending_office', 'office', 'admin'];
  const current = getRole(src);
  if (!current) return false;
  return HIERARCHY.indexOf(current) >= HIERARCHY.indexOf(min);
};
