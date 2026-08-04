import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

type AuthShellProps = PropsWithChildren<{
  description: string;
  footer?: ReactNode;
  title: string;
}>;

type AuthFieldProps = {
  autoComplete?: 'email' | 'name' | 'new-password' | 'password';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
};

export function AuthShell({ children, description, footer, title }: AuthShellProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BrandMark />
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>DAVETİM HESABI</Text>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          <View style={styles.card}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  autoComplete,
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoComplete === 'name' ? 'words' : 'none'}
        autoComplete={autoComplete}
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

export function AuthMessage({ children, tone = 'error' }: PropsWithChildren<{ tone?: 'error' | 'success' }>) {
  return (
    <View accessibilityLiveRegion="polite" style={[styles.message, tone === 'success' && styles.successMessage]}>
      <Ionicons
        color={tone === 'success' ? colors.success : colors.primaryText}
        name={tone === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={20}
      />
      <Text style={[styles.messageText, tone === 'success' && styles.successMessageText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  content: { flexGrow: 1, gap: spacing.xl, padding: spacing.xl },
  heading: { gap: spacing.sm, marginTop: spacing.lg },
  eyebrow: { ...engraved, color: colors.secondary },
  title: {
    color: colors.plum,
    fontFamily: typography.display,
    fontSize: 36,
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 39,
  },
  description: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 16, lineHeight: 24 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  field: { gap: spacing.sm },
  label: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  footer: { alignItems: 'center', gap: spacing.md },
  message: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  messageText: { color: colors.primaryText, flex: 1, fontFamily: typography.body, fontSize: 14, lineHeight: 20 },
  successMessage: { backgroundColor: colors.successSoft },
  successMessageText: { color: colors.success },
});
