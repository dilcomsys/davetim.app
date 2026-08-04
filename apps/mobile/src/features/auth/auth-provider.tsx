import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { identifyUser, trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { getSupabaseClient, isSupabaseConfigured, requireSupabaseClient } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unconfigured';

type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

type AuthContextValue = {
  session: Session | null;
  status: AuthStatus;
  user: User | null;
  handleAuthUrl: (url: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function callbackValue(url: string, key: string) {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  return parsed.searchParams.get(key) ?? hash.get(key);
}

function callbackError(url: string) {
  return callbackValue(url, 'error_description') ?? callbackValue(url, 'error');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'unconfigured');

  const handleAuthUrl = useCallback(async (url: string) => {
    const supabase = requireSupabaseClient();
    const errorMessage = callbackError(url);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    const code = callbackValue(url, 'code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return;
    }

    const accessToken = callbackValue(url, 'access_token');
    const refreshToken = callbackValue(url, 'refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setSession(null);
        setStatus('anonymous');
        return;
      }

      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'anonymous');
      identifyUser(data.session?.user.id ?? null);
    });

    /*
     * Analytics identity is bound here rather than in the sign-in screens.
     * There are four ways to end up with a session — password, Google, an
     * e-mail link, and a silent refresh on launch — and only this subscription
     * sees all of them. Clearing it on sign-out matters on a shared device: the
     * next account's events must not be attributed to the previous one.
     */
    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'anonymous');
      identifyUser(nextSession?.user.id ?? null);
    });

    const appStateSubscription = Platform.OS === 'web'
      ? null
      : AppState.addEventListener('change', (nextState) => {
          if (nextState === 'active') supabase.auth.startAutoRefresh();
          else supabase.auth.stopAutoRefresh();
        });

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url).catch(() => {
        setStatus('anonymous');
      });
    });

    void Linking.getInitialURL().then((url) => {
      if (url?.includes('/auth/callback')) {
        void handleAuthUrl(url).catch(() => {
          setStatus('anonymous');
        });
      }
    });

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
      appStateSubscription?.remove();
      linkSubscription.remove();
    };
  }, [handleAuthUrl]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    status,
    user: session?.user ?? null,
    handleAuthUrl,
    async resetPassword(email) {
      const { error } = await requireSupabaseClient().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: Linking.createURL('/auth/callback', { queryParams: { flow: 'reset-password' } }),
      });
      if (error) throw error;
    },
    async signIn(email, password) {
      const { error } = await requireSupabaseClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      trackEvent(ANALYTICS_EVENTS.signedIn, { method: 'password' });
    },
    /*
     * Kept wired but deliberately not surfaced anywhere in the UI.
     *
     * App Store Review Guideline 4.8 requires an equivalent privacy-focused
     * login — in practice Sign in with Apple — wherever a third-party login
     * like Google is offered. Until that is built, e-mail and password is the
     * only sign-in the app shows, which sidesteps 4.8 entirely. Re-surfacing
     * this button on iOS without adding Apple sign-in first is a rejection.
     */
    async signInWithGoogle() {
      const supabase = requireSupabaseClient();
      const redirectTo = Linking.createURL('/auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('Google giriş bağlantısı oluşturulamadı.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success') {
        await handleAuthUrl(result.url);
        trackEvent(ANALYTICS_EVENTS.signedIn, { method: 'google' });
      }
    },
    async signOut() {
      const { error } = await requireSupabaseClient().auth.signOut();
      if (error) throw error;
      trackEvent(ANALYTICS_EVENTS.signedOut);
    },
    async signUp(email, password, fullName) {
      const { data, error } = await requireSupabaseClient().auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: Linking.createURL('/auth/callback'),
        },
      });
      if (error) throw error;
      trackEvent(ANALYTICS_EVENTS.signedUp, { method: 'password' });
      return { requiresEmailConfirmation: !data.session };
    },
    async updatePassword(password) {
      const { error } = await requireSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
    },
  }), [handleAuthUrl, session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir.');
  return value;
}
