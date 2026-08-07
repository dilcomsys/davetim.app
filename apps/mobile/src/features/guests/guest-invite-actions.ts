import * as Clipboard from 'expo-clipboard';
import { Linking, Platform, Share } from 'react-native';

import { smsUrl, whatsappUrl } from '@/lib/guest-invite';

/*
 * Getting one invitation into one guest's hands.
 *
 * Before this the only action was "copy to clipboard": the host copied a link,
 * left the app, found the contact, pasted, sent, came back, and did it again for
 * the next guest. For a wedding list that is the same six steps a hundred times.
 *
 * The chain below is ordered by how likely each channel is to work rather than
 * by preference. WhatsApp first because in Turkey that is where invitations are
 * sent; SMS next because every phone has it; the share sheet after that because
 * it reaches whatever else is installed; the clipboard last, which is where we
 * started and is still better than nothing happening.
 */

export type InviteOutcome =
  | { channel: 'whatsapp' | 'sms' | 'share'; kind: 'opened' }
  | { kind: 'copied' };

/**
 * `canOpenURL` is necessary but not sufficient on iOS, where it answers from the
 * Info.plist scheme allowlist and can report true for an app that is not
 * installed. The open itself is the real test, so both are tried and any failure
 * falls through to the next channel.
 */
async function tryOpen(url: string | null) {
  if (!url) return false;
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function sendInvite({ message, phone }: { message: string; phone?: string | null }): Promise<InviteOutcome> {
  if (await tryOpen(whatsappUrl(phone, message))) return { channel: 'whatsapp', kind: 'opened' };
  if (await tryOpen(smsUrl(phone, message, Platform.OS === 'ios' ? 'ios' : 'android'))) {
    return { channel: 'sms', kind: 'opened' };
  }

  try {
    // A dismissed sheet counts as opened: the host saw their options and chose
    // not to send. Falling through on dismissal would copy to the clipboard and
    // report that as the outcome, which is a lie about what just happened.
    await Share.share({ message });
    return { channel: 'share', kind: 'opened' };
  } catch {
    // Fall through: the reason the sheet refused does not change the fallback.
  }

  await Clipboard.setStringAsync(message);
  return { kind: 'copied' };
}

/** The whole list at once, for a host who would rather work through them elsewhere. */
export async function shareInviteList(text: string): Promise<InviteOutcome> {
  try {
    await Share.share({ message: text });
    return { channel: 'share', kind: 'opened' };
  } catch {
    await Clipboard.setStringAsync(text);
    return { kind: 'copied' };
  }
}
