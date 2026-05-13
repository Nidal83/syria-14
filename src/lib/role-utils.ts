import type { User } from '@/contexts/AuthContext';

export type OfficeStatus = 'pending' | 'pending_review' | 'approved' | 'rejected';

export const isAdmin = (user?: User | null): boolean => user?.role === 'admin';
export const isOffice = (user?: User | null): boolean => user?.role === 'office';
export const isApprovedOffice = (user?: User | null): boolean =>
  user?.role === 'office' && user.officeStatus === 'approved';
export const isPendingOfficeApplicant = (user?: User | null): boolean =>
  user?.officeStatus === 'pending_review';
export const isRejectedOfficeApplicant = (user?: User | null): boolean =>
  user?.officeStatus === 'rejected';
export const canCreateProperty = (user?: User | null): boolean => isApprovedOffice(user);
export const canApproveOffices = (user?: User | null): boolean => isAdmin(user);
export const canManageUsers = (user?: User | null): boolean => isAdmin(user);
