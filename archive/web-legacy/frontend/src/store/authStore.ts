import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type AuthUser, type SignUpData, type SignInData } from '../services/authService'
import { analyticsService } from '../services/analyticsService'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  // State
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  signUp: (data: SignUpData) => Promise<{ user: any; session: any }>
  signIn: (data: SignInData) => Promise<{ user: any; session: any }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (data: { email: string }) => Promise<void>
  updateProfile: (data: { fullName?: string; phone?: string; avatarUrl?: string }) => Promise<void>
  updateUser: (user: AuthUser | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,

      // Initialize auth state
      initialize: async () => {
        if (get().isInitialized) return

        set({ isLoading: true })

        try {
          // Get current session and user
          const session = await authService.getCurrentSession()
          const user = await authService.getCurrentUser()

          // If session exists but user is null (user deleted from Supabase), clear session
          if (session && !user) {
            console.warn('⚠️ Session exists but user not found - clearing session');
            localStorage.clear();
            sessionStorage.clear();
            set({
              session: null,
              user: null,
              isInitialized: true,
              isLoading: false
            });
            return;
          }

          set({
            session,
            user,
            isInitialized: true,
            isLoading: false
          })

          // Listen to auth state changes
          authService.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);

            if (event === 'SIGNED_IN' && session) {
              const user = await authService.getCurrentUser()

              // Track stored user properties on auto-login
              if (user) {
                analyticsService.setUserProperties({
                  id: user.id,
                  tier: user.subscriptionTier,
                  method: 'auto'
                });
              }

              set({ session, user })
            } else if (event === 'SIGNED_OUT') {
              set({ session: null, user: null })
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session })
            } else if (event === 'USER_DELETED') {
              console.warn('⚠️ User deleted event received');
              localStorage.clear();
              sessionStorage.clear();
              set({ session: null, user: null })
            }
          })
        } catch (error) {
          console.error('Auth initialization error:', error)
          // Don't clear storage on init error - might be network issue
          // Only clear if user explicitly signs out or is deleted
          set({
            session: null,
            user: null,
            isInitialized: true,
            isLoading: false
          })
        }
      },

      // Sign up
      signUp: async (data: SignUpData) => {
        set({ isLoading: true })

        try {
          const result = await authService.signUp(data)

          if (result.user && result.session) {
            // Ensure subscription exists after signup
            await authService.ensureSubscription(result.user.id)

            const user = await authService.getCurrentUser()

            // Track signup
            analyticsService.trackSignUp('email');

            if (user) {
              analyticsService.setUserProperties({
                id: user.id,
                tier: user.subscriptionTier || 'free',
                method: 'email'
              });
            }

            set({
              session: result.session,
              user,
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }

          return result
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Sign in
      signIn: async (data: SignInData) => {
        set({ isLoading: true })

        try {
          const result = await authService.signIn(data)

          if (result.user && result.session) {
            const user = await authService.getCurrentUser()

            // Track login
            analyticsService.trackLogin('email');

            if (user) {
              analyticsService.setUserProperties({
                id: user.id,
                tier: user.subscriptionTier || 'free',
                method: 'email'
              });
            }

            set({
              session: result.session,
              user,
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }

          return result
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Google sign in
      signInWithGoogle: async () => {
        set({ isLoading: true })

        try {
          await authService.signInWithGoogle()
          // Track google login attempt (actual success handled in callback)
          analyticsService.trackLogin('google');

          // Auth state will be updated by the onAuthStateChange listener
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true })

        try {
          await authService.signOut()

          // Clear all storage
          localStorage.clear()
          sessionStorage.clear()

          set({
            user: null,
            session: null,
            isLoading: false
          })
        } catch (error) {
          console.error('Sign out error:', error)
          // Even if sign out fails, clear local data
          localStorage.clear()
          sessionStorage.clear()
          set({
            user: null,
            session: null,
            isLoading: false
          })
          throw error
        }
      },

      // Reset password
      resetPassword: async (data: { email: string }) => {
        set({ isLoading: true })

        try {
          await authService.resetPassword(data)
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Update profile
      updateProfile: async (data: { fullName?: string; phone?: string; avatarUrl?: string }) => {
        set({ isLoading: true })

        try {
          await authService.updateProfile(data)

          // Refresh user data
          const user = await authService.getCurrentUser()
          set({
            user,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // Update user data
      updateUser: (user: AuthUser | null) => {
        set({ user: user ? { ...user } : null }); // Create new object reference
      },

      // Clear any errors (if needed for UI feedback)
      clearError: () => {
        // This can be used for clearing UI error states
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        // Only persist user and session, not loading states
        user: state.user,
        session: state.session,
        isInitialized: state.isInitialized
      }),
    }
  )
)

// Helper hooks for easier usage
export const useAuth = () => {
  const store = useAuthStore()

  return {
    // State
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user,
    isInitialized: store.isInitialized,

    // Actions
    initialize: store.initialize,
    signUp: store.signUp as (data: SignUpData) => Promise<{ user: any; session: any }>,
    signIn: store.signIn as (data: SignInData) => Promise<{ user: any; session: any }>,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
    resetPassword: store.resetPassword,
    updateProfile: store.updateProfile,
  }
}
