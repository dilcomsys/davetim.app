import toast from 'react-hot-toast';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  subscriptionEndDate?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  // Sign up new user
  async signUp(data: SignUpData) {
    // Attempting signup
    
    try {
      // Use Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase signup error:', authError);
        throw new Error(authError.message);
      }

      console.log('✅ Signup successful for:', data.email);
      
      // Handle email confirmation requirement
      if (authData.session === null && authData.user && !authData.user.email_confirmed_at) {
        toast.success('Hesap oluşturuldu! Lütfen e-postanızı kontrol edin ve doğrulama linkine tıklayın.', { 
          duration: 10000 
        });
      } else {
        toast.success('Hesap başarıyla oluşturuldu!');
      }
      
      return {
        user: authData.user,
        session: authData.session
      };
    } catch (error: any) {
      console.error('❌ Supabase signup error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Kayıt sırasında bir hata oluştu';
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Şifre en az 6 karakter olmalıdır.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Geçerli bir e-posta adresi giriniz.';
      } else if (error.message.includes('weak password')) {
        errorMessage = 'Şifreniz çok zayıf. Daha güçlü bir şifre seçin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error toast
      toast.error(errorMessage, { duration: 8000 });
      
      throw new Error(errorMessage);
    }
  }

  // Sign in user
  async signIn(data: SignInData) {
    // Attempting login
    
    try {
      // Use Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('❌ Supabase login error:', authError);
        throw new Error(authError.message);
      }

      console.log('✅ Login successful for:', data.email);
      toast.success('Giriş başarılı!');
      
      return {
        user: authData.user,
        session: authData.session
      };
    } catch (error: any) {
      console.error('❌ Supabase login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Giriş sırasında bir hata oluştu';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'E-postanızı doğrulamadınız. Lütfen gelen kutunuzu kontrol edin.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Çok fazla deneme yaptınız. Lütfen bir süre bekleyin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show user-friendly error toast
      toast.error(errorMessage, { duration: 8000 });
      
      throw new Error(errorMessage);
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      console.log('🌐 Supabase Google OAuth');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('❌ Google sign in error:', error);
        toast.error(error.message);
        throw error;
      }

      console.log('🚀 Google OAuth initiated:', data);
      return data;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error('Google ile giriş yapılırken bir hata oluştu');
      throw error;
    }
  }

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase signout error:', error);
        throw error;
      }
      
      console.log('✅ Supabase signout successful');
      toast.success('Çıkış yapıldı');
      return true;
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('No current user:', error?.message);
        return null;
      }

      // Get subscription from database (not from metadata)
      let subscriptionTier: 'free' | 'pro' | 'premium' = 'free';
      let subscriptionEndDate: string | undefined = undefined;

      try {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('tier, end_date, status')
          .eq('user_id', user.id)
          .single();

        if (subscription && !subError) {
          subscriptionTier = subscription.tier || 'free';
          subscriptionEndDate = subscription.end_date || undefined;
        }
      } catch (subError) {
        console.warn('❌ Could not fetch subscription, defaulting to free:', subError);
      }

      // Map Supabase user to our AuthUser format
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.email || '',
        phone: user.user_metadata?.phone || undefined,
        avatarUrl: user.user_metadata?.avatar_url || undefined,
        subscriptionTier,
        subscriptionEndDate,
      };
      
      return authUser;
    } catch (error: any) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get current session (check if user is logged in)
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No current session:', error?.message);
        return null;
      }
      
      return session;
    } catch (error: any) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('❌ Supabase reset password error:', error);
        throw error;
      }
      
      console.log('✅ Reset password email sent');
      toast.success('Şifre sıfırlama e-postası gönderildi');
      return true;
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      const errorMessage = error.message || 'Şifre sıfırlama sırasında bir hata oluştu';
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData) {
    try {
      const { data: userData, error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone,
        }
      });

      if (error) {
        console.error('❌ Supabase update profile error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully:', userData);
      toast.success('Profil güncellendi');
      return userData.user;
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      const errorMessage = error.message || 'Profil güncellenirken hata oluştu';
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  // Change password
  async changePassword(data: ChangePasswordData) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        console.error('❌ Supabase change password error:', error);
        throw error;
      }

      console.log('✅ Password changed successfully');
      toast.success('Şifre başarıyla değiştirildi');
      return true;
    } catch (error: any) {
      console.error('Change password error:', error);
      
      const errorMessage = error.message || 'Şifre değiştirme sırasında bir hata oluştu';
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  // Ensure subscription exists for user (fallback if trigger doesn't work)
  async ensureSubscription(userId: string): Promise<void> {
    try {
      // Check if subscription exists
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // If subscription doesn't exist, create one
      if (!data && !error) {
        console.log('📝 Creating free subscription for new user...');
        
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: 'free',
            status: 'active',
            start_date: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Failed to create subscription:', insertError);
          throw insertError;
        }

        console.log('✅ Free subscription created successfully');
        toast.success('Hesabınız hazır!', { duration: 3000 });
      }
    } catch (error: any) {
      console.error('❌ Ensure subscription error:', error);
      // Don't throw - allow signup to complete even if subscription creation fails
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    console.log('🔄 Supabase auth state listener set up');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Supabase auth state changed:', event, session);
      callback(event, session);
    });
    
    return {
      data: {
        subscription
      }
    };
  }
}

export const authService = new AuthService();