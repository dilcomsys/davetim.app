import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have valid reset token in URL and set session
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      console.log('✅ Valid password reset token found, setting session...');
      
      // Set the session in Supabase using the tokens from URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('❌ Error setting session:', error);
          setIsValidToken(false);
          toast.error('Session ayarlanamadı. Lütfen yeni şifre sıfırlama talebinde bulunun.');
          setTimeout(() => navigate('/auth'), 2000);
        } else {
          console.log('✅ Session set successfully');
          setIsValidToken(true);
        }
      });
    } else {
      setIsValidToken(false);
      toast.error('Geçersiz şifre sıfırlama bağlantısı');
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidToken) {
      toast.error('Geçersiz token');
      return;
    }

    // Validate form
    if (!password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset successful');
      toast.success('Şifre başarıyla güncellendi! Giriş yapabilirsiniz.', { 
        duration: 6000 
      });
      
      // Redirect to login page after success
      setTimeout(() => navigate('/auth'), 2000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Şifre sıfırlama sırasında bir hata oluştu';
      if (error.message?.includes('weak password')) {
        errorMessage = 'Şifreniz çok zayıf. Daha güçlü bir şifre seçin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Geçersiz Bağlantı</h2>
          <p className="text-gray-600">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Yeni Şifre Belirleyin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hesabınız için yeni bir şifre oluşturun
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Yeni Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Güncelleniyor...
                </div>
              ) : (
                'Şifreyi Güncelle'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              ← Giriş sayfasına dön
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
