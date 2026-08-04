import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton } from '@/components/primary-button';
import { AuthField, AuthMessage, AuthShell } from '@/features/auth/auth-ui';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage, passwordRequirementMessage } from '@/features/auth/auth-utils';

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const passwordProblem = passwordRequirementMessage(password);
    if (passwordProblem) {
      setError(passwordProblem);
      return;
    }
    if (password !== confirmation) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      router.replace('/(tabs)/profile' as Href);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell description="Yeni şifreniz diğer hesaplarda kullandığınız şifrelerden farklı olsun." title="Yeni şifre belirle">
      {error ? <AuthMessage>{error}</AuthMessage> : null}
      <AuthField autoComplete="new-password" label="Yeni şifre" onChangeText={setPassword} placeholder="En az 8 karakter, rakam ve büyük/küçük harf" secureTextEntry value={password} />
      <AuthField autoComplete="new-password" label="Şifreyi doğrula" onChangeText={setConfirmation} placeholder="Şifreyi tekrar girin" secureTextEntry value={confirmation} />
      <PrimaryButton accessibilityLabel="Yeni şifreyi kaydet" loading={loading} onPress={submit}>Şifreyi kaydet</PrimaryButton>
    </AuthShell>
  );
}
