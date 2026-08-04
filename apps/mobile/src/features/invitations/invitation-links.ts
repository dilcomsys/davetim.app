import * as Linking from 'expo-linking';

import { publicAppOrigin } from '@/config/feature-flags';

export function getPublicInvitationUrl(invitationId: string) {
  if (publicAppOrigin) return `${publicAppOrigin}/i/${encodeURIComponent(invitationId)}`;
  return Linking.createURL(`/i/${encodeURIComponent(invitationId)}`);
}
