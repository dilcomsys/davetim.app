import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { AuthField, AuthMessage, AuthShell } from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage, validateEmail } from '@/features/auth/auth-utils';
import { colors, typography } from '@/theme/tokens';

export default function SignInScreen() {
  const { signIn, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | null>(null);

  const configured = status !== 'unconfigured';

  async function submit() {
    if (!validateEmail(email) || !password) {
      setError('Geçerli e-posta adresinizi ve şifrenizi girin.');
      return;
    }

    setError(null);
    setLoading('email');
    try {
      await signIn(email, password);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(null);
    }
  }

  return (
    <AuthShell
      description="Davetlerini, yanıtları ve paylaşımlarını kaldığın yerden yönet."
      footer={(
        <Text style={styles.footerText}>
          Hesabın yok mu?{' '}
          <Link href={'/(auth)/sign-up' as Href} style={styles.link}>Ücretsiz kayıt ol</Link>
        </Text>
      )}
      title="Tekrar hoş geldin">
      {!configured ? <AuthMessage>Supabase ortam değişkenleri eklenmeden canlı hesap girişi kullanılamaz.</AuthMessage> : null}
      {error ? <AuthMessage>{error}</AuthMessage> : null}
      <AuthField autoComplete="email" label="E-posta" onChangeText={setEmail} placeholder="ornek@email.com" value={email} />
      <AuthField autoComplete="password" label="Şifre" onChangeText={setPassword} placeholder="Şifreniz" secureTextEntry value={password} />
      <Link href={'/(auth)/forgot-password' as Href} style={styles.forgot}>Şifremi unuttum</Link>
      <PrimaryButton accessibilityLabel="E-posta ile giriş yap" disabled={!configured} loading={loading === 'email'} onPress={submit}>
        Giriş yap
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 14 },
  footerText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 15 },
  link: { color: colors.secondary, fontFamily: typography.bodyMedium, fontWeight: '700' },
});
