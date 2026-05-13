import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'guest' | 'user' | 'office' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /**
   * Whether the user has confirmed their email. Mirrors Supabase Auth's
   * `email_confirmed_at`. When Supabase project setting "Confirm email" is ON,
   * users with `emailVerified === false` cannot log in. We expose this so the
   * UI can prompt for resend / show banners as appropriate.
   */
  emailVerified: boolean;
  officeName?: string;
  officeStatus?: 'pending' | 'pending_review' | 'approved' | 'rejected';
}

type LoginErrorCode = 'invalid_credentials' | 'email_not_confirmed' | 'unknown';

type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string; code: LoginErrorCode; email?: string };

type RegisterResult = { success: true } | { success: false; error: string };

type PasswordResetRequestResult = { success: true } | { success: false; error: string };

type PasswordUpdateResult = { success: true } | { success: false; error: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  /**
   * Sends a password recovery email. Supabase emails a magic link that lands on
   * `redirectTo`. The redirect URL MUST be allow-listed in Supabase project
   * settings → Auth → URL Configuration → Redirect URLs.
   */
  requestPasswordReset: (email: string, redirectTo: string) => Promise<PasswordResetRequestResult>;
  /**
   * Sets a new password for the currently-authenticated user. Used by both the
   * "I clicked the recovery email link" flow and the "change my password while
   * logged in" flow.
   */
  updatePassword: (newPassword: string) => Promise<PasswordUpdateResult>;
  /**
   * Change-password flow for an already-authenticated user. Re-verifies the
   * current password to defend against session-hijack-style attacks (Supabase's
   * `updateUser({ password })` does not require it).
   */
  verifyAndChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<PasswordUpdateResult>;
  /**
   * Re-sends the email confirmation link to a given address. Used post-registration
   * and after a login attempt that failed with `email_not_confirmed`.
   */
  /**
   * Begin Google OAuth sign-in. Supabase will redirect the browser to Google's
   * consent screen, then back to `redirectTo`. The session settles automatically
   * via `detectSessionInUrl` and the existing auth-state listener.
   *
   * Note: Google sign-up always creates a `user` role account. Offices must
   * register through the full email/password form to capture business metadata.
   */
  signInWithGoogle: (redirectTo: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<PasswordResetRequestResult>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'office';
  officeName?: string;
  managerName?: string;
  governorate?: string;
  area?: string;
  address?: string;
  description?: string;
  verificationDocumentUrl?: string;
  idDocumentUrl?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Fetch role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id);

      // Prioritize: admin > office > user
      const roleList = roles?.map((r) => r.role) || ['user'];
      const role: UserRole = roleList.includes('admin')
        ? 'admin'
        : roleList.includes('office')
          ? 'office'
          : 'user';

      // Fetch office info for any user who owns an office/application record.
      // Pending or rejected applications are stored in the offices table too.
      let officeName: string | undefined;
      let officeStatus: 'pending' | 'pending_review' | 'approved' | 'rejected' | undefined;
      const { data: office } = await supabase
        .from('offices')
        .select('office_name, status')
        .eq('owner_id', supabaseUser.id)
        .single();
      if (office) {
        officeName = office.office_name;
        officeStatus = office.status as 'pending' | 'pending_review' | 'approved' | 'rejected';
      }

      // Fetch favorites
      const { data: favs } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', supabaseUser.id);
      setFavorites(favs?.map((f) => f.property_id) || []);

      return {
        id: supabaseUser.id,
        name: profile?.name || supabaseUser.user_metadata?.name || '',
        email: profile?.email || supabaseUser.email || '',
        phone: profile?.phone || '',
        role,
        emailVerified: Boolean(supabaseUser.email_confirmed_at),
        officeName,
        officeStatus,
      };
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          const profile = await fetchUserProfile(newSession.user);
          setUser(profile);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setFavorites([]);
        setLoading(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchUserProfile(existingSession.user).then((profile) => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (!session?.user) return;

    const refreshProfile = async () => {
      const profile = await fetchUserProfile(session.user);
      if (profile) setUser(profile);
    };

    const channel = supabase
      .channel(`profile-refresh-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${session.user.id}` },
        () => {
          refreshProfile();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offices', filter: `owner_id=eq.${session.user.id}` },
        () => {
          refreshProfile();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.user, fetchUserProfile]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        const message = error?.message ?? 'Login failed';
        // Supabase returns 'Email not confirmed' (or code 'email_not_confirmed'
        // in newer client versions). Match defensively against both shapes.
        const isUnconfirmed =
          (error as { code?: string } | undefined)?.code === 'email_not_confirmed' ||
          /email\s*not\s*confirmed/i.test(message);
        const isInvalidCreds = /invalid\s*login/i.test(message);
        const code: LoginErrorCode = isUnconfirmed
          ? 'email_not_confirmed'
          : isInvalidCreds
            ? 'invalid_credentials'
            : 'unknown';
        return { success: false, error: message, code, email };
      }

      // Resolve the profile synchronously so the caller can route on role.
      // Auth-state listener will populate the context as well; this just
      // gives the caller an immediate, deterministic answer.
      const profile = await fetchUserProfile(data.user);
      if (!profile) {
        return {
          success: false,
          error: 'Failed to load profile',
          code: 'unknown',
          email,
        };
      }

      return { success: true, user: profile };
    },
    [fetchUserProfile],
  );

  const register = useCallback(async (data: RegisterData): Promise<RegisterResult> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: data.role === 'office' ? data.managerName : data.name,
          phone: data.phone,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { success: false, error: 'Registration failed' };
    }

    // Update phone in profile
    await supabase
      .from('profiles')
      .update({
        phone: data.phone,
        name: data.role === 'office' ? data.managerName || '' : data.name,
      })
      .eq('id', userId);

    // If registering as an office, create the application record but do not
    // grant the office role until an admin approves it.
    if (data.role === 'office') {
      const officeSlug = data.officeName
        ? `${data.officeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Math.random().toString(36).slice(2, 8)}`
        : null;
      const { error: officeError } = await supabase.from('offices').insert({
        owner_id: userId,
        office_name: data.officeName || '',
        owner_name: data.managerName || '',
        phone: data.phone,
        email: data.email,
        governorate_id: data.governorate || null,
        area_id: data.area || null,
        address: data.address || '',
        description: data.description || '',
        status: 'pending_review',
        verification_document_url: data.verificationDocumentUrl || null,
        id_document_url: data.idDocumentUrl || null,
        office_slug: officeSlug,
      });

      if (officeError) {
        console.error('Failed to create office record:', officeError);
        return { success: false, error: `Failed to create office record: ${officeError.message}` };
      }
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string, redirectTo: string): Promise<PasswordResetRequestResult> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [],
  );

  const resendVerificationEmail = useCallback(
    async (email: string): Promise<PasswordResetRequestResult> => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [],
  );

  const signInWithGoogle = useCallback(
    async (redirectTo: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // Ask Google to NOT auto-select an account on subsequent visits —
          // useful when users have multiple Google accounts.
          queryParams: { prompt: 'select_account' },
        },
      });
      // Note: on success, the browser navigates away to Google before this
      // promise resolves. We return { success: true } if no immediate error.
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [],
  );

  const updatePassword = useCallback(async (newPassword: string): Promise<PasswordUpdateResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const verifyAndChangePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<PasswordUpdateResult> => {
      const currentEmail = session?.user?.email;
      if (!currentEmail) {
        return { success: false, error: 'Not authenticated' };
      }

      // Re-verify the current password by attempting a sign-in with it.
      // Supabase doesn't expose a dedicated "verify current password" RPC, so
      // this is the standard pattern. Sign-in re-uses the existing session if
      // the credentials match.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });
      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return { success: true };
    },
    [session],
  );

  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      if (!session?.user) return;
      const userId = session.user.id;
      const isFav = favorites.includes(propertyId);

      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);
        setFavorites((prev) => prev.filter((f) => f !== propertyId));
      } else {
        await supabase.from('favorites').insert({ user_id: userId, property_id: propertyId });
        setFavorites((prev) => [...prev, propertyId]);
      }
    },
    [session, favorites],
  );

  const isFavorite = useCallback(
    (propertyId: string) => {
      return favorites.includes(propertyId);
    },
    [favorites],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        logout,
        requestPasswordReset,
        resendVerificationEmail,
        signInWithGoogle,
        updatePassword,
        verifyAndChangePassword,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
