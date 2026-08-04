import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { AuthField, AuthMessage, AuthShell } from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage, passwordRequirementMessage, validateEmail } from '@/features/auth/auth-utils';
import { colors, typography } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp, status } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (fullName.trim().length < 2 || !validateEmail(email)) {
      setError('Adınızı ve geçerli bir e-posta adresi girin.');
      return;
    }
    // Naming the failing rule, not restating all of them: "en az 8 karakterli
    // bir şifre girin" was shown for a twelve-character password with no digit.
    const passwordProblem = passwordRequirementMessage(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }

    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const result = await signUp(email, password, fullName);
      if (result.requiresEmailConfirmation) setNotice('E-posta adresinize gönderilen doğrulama bağlantısını açın.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      description="Temel davet oluşturma, paylaşma ve RSVP takibi ücretsiz kalır."
      footer={(
        <Text style={styles.footerText}>
          Zaten hesabın var mı?{' '}
          <Link href={'/(auth)/sign-in' as Href} style={styles.link}>Giriş yap</Link>
        </Text>
      )}
      title="İlk davetini başlat">
      {error ? <AuthMessage>{error}</AuthMessage> : null}
      {notice ? <AuthMessage tone="success">{notice}</AuthMessage> : null}
      <AuthField autoComplete="name" label="Ad soyad" onChangeText={setFullName} placeholder="Adınız Soyadınız" value={fullName} />
      <AuthField autoComplete="email" label="E-posta" onChangeText={setEmail} placeholder="ornek@email.com" value={email} />
      <AuthField autoComplete="new-password" label="Şifre" onChangeText={setPassword} placeholder="En az 8 karakter, rakam ve büyük/küçük harf" secureTextEntry value={password} />
      <PrimaryButton accessibilityLabel="Ücretsiz hesap oluştur" disabled={status === 'unconfigured'} loading={loading} onPress={submit}>
        Hesap oluştur
      </PrimaryButton>
      {/* These have to be reachable before the account exists. They used to be
          plain text, and the only route to the documents was the profile tab —
          behind the sign-up you were being asked to agree to. */}
      <Text style={styles.legal}>
        Devam ederek{' '}
        <Link href={'/legal/terms' as Href} style={styles.link}>kullanım koşullarını</Link>
        {' '}ve{' '}
        <Link href={'/legal/privacy' as Href} style={styles.link}>gizlilik politikasını</Link>
        {' '}kabul etmiş olursunuz.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 15 },
  link: { color: colors.secondary, fontFamily: typography.bodyMedium, fontWeight: '700' },
  legal: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
});
