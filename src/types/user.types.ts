import type { UserRole } from './roles.types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  profile: Profile;
}
