import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { legalDocuments } from '@/features/legal/legal-documents';
import { SUPPORT_ADDRESS } from '@/lib/mailto';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LegalDocumentScreen() {
  const { document: documentKey } = useLocalSearchParams<{ document: string }>();
  const router = useRouter();
  const document = legalDocuments[documentKey];

  if (!document) return <View style={styles.center}><Text style={styles.title}>Belge bulunamadı.</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Geri dön</Text></Pressable></View>;

  return (
    <Screen action={<Pressable accessibilityLabel="Geri dön" onPress={() => router.back()}><Ionicons color={colors.ink} name="close" size={26} /></Pressable>} eyebrow={`GÜNCELLEME · ${document.lastUpdated}`} title={document.title}>
      {document.sections.map((section) => <View key={section.title} style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text><Text style={styles.content}>{section.content}</Text></View>)}
      {/* The footer used to carry an internal note — that the text still needed
          a legal review before release. That is a message to ourselves, and it
          was printed at the bottom of the privacy policy and the terms, where
          both users and store reviewers read it as the document disclaiming
          itself. The reminder belongs in the release plan; what a reader needs
          here is where to ask a question. */}
      <Text style={styles.disclaimer}>
        Sorularınız için {SUPPORT_ADDRESS} adresine yazabilirsiniz.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 25 },
  link: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 14 },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  sectionTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 20, fontWeight: '700' },
  content: { color: colors.ink, fontFamily: typography.body, fontSize: 14, lineHeight: 22 },
  disclaimer: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
