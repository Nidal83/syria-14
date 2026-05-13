/**
 * Centralized role definitions for the platform.
 *
 * Current roles: user | pending_office | office | admin
 * Future-ready roles listed in FutureRole — add them to AppRole when implemented.
 */

export const USER_ROLES = ['user', 'pending_office', 'office', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Roles reserved for future phases (not yet enforced by RLS). */
export type FutureRole = 'office_agent' | 'moderator' | 'support';

export type AppRole = UserRole | FutureRole;

/** Ordered by privilege level — higher index = more privilege. */
export const ROLE_HIERARCHY: UserRole[] = ['user', 'pending_office', 'office', 'admin'];

export function roleRank(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}
