import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { AuthField, AuthMessage, AuthShell } from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage, validateEmail } from '@/features/auth/auth-utils';
import { colors, typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { resetPassword, status } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      description="E-posta adresinize güvenli bir şifre yenileme bağlantısı göndereceğiz."
      footer={<Link href={'/(auth)/sign-in' as Href} style={styles.link}>Giriş ekranına dön</Link>}
      title="Şifreni yenile">
      {error ? <AuthMessage>{error}</AuthMessage> : null}
      {sent ? <AuthMessage tone="success">Bağlantı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.</AuthMessage> : null}
      <AuthField autoComplete="email" label="E-posta" onChangeText={setEmail} placeholder="ornek@email.com" value={email} />
      <PrimaryButton accessibilityLabel="Şifre yenileme bağlantısı gönder" disabled={status === 'unconfigured'} loading={loading} onPress={submit}>
        Bağlantı gönder
      </PrimaryButton>
      <Text style={styles.note}>Güvenlik nedeniyle bir hesabın kayıtlı olup olmadığını bu ekranda açıklamayız.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  note: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
});
