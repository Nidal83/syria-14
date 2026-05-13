import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/user.types';
import type { UserRole } from '@/types/roles.types';

// ─── Result types ────────────────────────────────────────────────────────────

export type AuthResult = { success: true } | { success: false; error: string };

export type LoginResult =
  | { success: true; profile: Profile }
  | { success: false; error: string; code: 'invalid_credentials' | 'unknown' };

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  verifyAndChangePassword: (current: string, next: string) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent double-fetch on rapid auth-state events
  const fetchingRef = useRef(false);

  const fetchProfile = useCallback(async (user: SupabaseUser): Promise<Profile | null> => {
    if (fetchingRef.current) return null;
    fetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, avatar_url, role, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error || !data) return null;

      return data as Profile;
    } catch {
      return null;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await fetchProfile(session.user);
    if (p) setProfile(p);
  }, [session, fetchProfile]);

  // ── Realtime: re-fetch profile when role changes ──────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`profile-sync:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        async () => {
          const p = await fetchProfile(session.user);
          if (p) setProfile(p);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session?.user?.id, session?.user, fetchProfile]);

  // ── Bootstrap auth state ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (newSession?.user) {
        // Defer to avoid Supabase internal deadlock
        setTimeout(async () => {
          if (!mounted) return;
          const p = await fetchProfile(newSession.user);
          setProfile(p);
          setIsLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    // Read initial session (may already exist from previous visit)
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      setSession(existing);
      if (existing?.user) {
        fetchProfile(existing.user).then((p) => {
          if (mounted) {
            setProfile(p);
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        const msg = error?.message ?? 'Login failed';
        const isInvalid = /invalid login|invalid_credentials/i.test(msg);
        return {
          success: false,
          error: msg,
          code: isInvalid ? 'invalid_credentials' : 'unknown',
        };
      }

      const p = await fetchProfile(data.user);
      if (!p) return { success: false, error: 'Failed to load profile', code: 'unknown' };

      return { success: true, profile: p };
    },
    [fetchProfile],
  );

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, phone: data.phone },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) return { success: false, error: error.message };
    if (!authData.user) return { success: false, error: 'Registration failed' };

    // Update phone/name on the auto-created profile row
    await supabase
      .from('profiles')
      .update({ name: data.name, phone: data.phone })
      .eq('id', authData.user.id);

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const verifyAndChangePassword = useCallback(
    async (current: string, next: string): Promise<AuthResult> => {
      const email = session?.user?.email;
      if (!email) return { success: false, error: 'Not authenticated' };

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (verifyError) return { success: false, error: 'Current password is incorrect' };

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    [session],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        profile,
        session,
        isLoading,
        isAuthenticated: Boolean(profile),
        login,
        register,
        logout,
        signInWithGoogle,
        requestPasswordReset,
        updatePassword,
        verifyAndChangePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Convenience: current user's role, or undefined if not authenticated. */
export function useRole(): UserRole | undefined {
  return useAuth().profile?.role;
}
