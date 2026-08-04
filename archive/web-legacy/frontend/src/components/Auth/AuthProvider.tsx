import React, { useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../UI/LoadingSpinner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isInitialized, isLoading, initialize, user, signOut } = useAuth();

  useEffect(() => {
    // Initialize auth on app start
    if (!isInitialized) {
      initialize();
    }

    // Listen for auth changes (like email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log important auth events
        if (event !== 'INITIAL_SESSION') {
          console.log('🔔 Auth event:', event, session?.user?.email);
        }
        
        if (event === 'SIGNED_IN' && session) {
          // Don't show toast for initial page load or for programmatic sign-ins
          // The authService already shows success toasts
          return;
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.success('Şifre sıfırlama e-postası gönderildi!');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, initialize]);

  // Periodic session validation - check if user still exists in database
  useEffect(() => {
    if (!user) return;

    const validateSession = async () => {
      try {
        // Check if user still exists in Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.warn('⚠️ Auth user no longer exists - forcing logout');
          toast.error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
          localStorage.clear();
          sessionStorage.clear();
          await signOut();
          window.location.href = '/';
          return;
        }
        
        // Also check if getCurrentUser works (checks subscriptions table)
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          console.warn('⚠️ User data incomplete - forcing logout');
          toast.error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
          localStorage.clear();
          sessionStorage.clear();
          await signOut();
          window.location.href = '/';
        }
      } catch (error) {
        console.error('❌ Session validation error:', error);
        localStorage.clear();
        sessionStorage.clear();
        await signOut();
        window.location.href = '/';
      }
    };

    // Validate immediately
    validateSession();

    // Validate every 30 seconds
    const interval = setInterval(validateSession, 30000);

    return () => clearInterval(interval);
  }, [user, signOut]);

  // Show loading spinner while initializing auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-xl">D</span>
            </div>
          </div>
          <LoadingSpinner size="lg" message="Davetim yükleniyor..." />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
