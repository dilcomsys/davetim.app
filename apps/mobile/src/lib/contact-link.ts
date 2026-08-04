import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { SUPPORT_ADDRESS, supportMailUrl } from '@/lib/mailto';

/*
 * Opening a `mailto:` is the one outbound link the app cannot assume will work.
 * A device with no mail account configured — the default state of a fresh
 * simulator and of plenty of real Android phones — rejects `openURL`, and the
 * previous call site discarded that rejection with `void`. Tapping "Destek" or
 * "Reklam bildir" then did nothing at all, with no error and no address to fall
 * back on. Store review reaches support and ad reporting through exactly those
 * two rows, so silently doing nothing is a submission risk, not only a bug.
 *
 * `canOpenURL` alone is not enough: iOS answers it from the URL-scheme
 * allowlist, so it can report true and the open still fail. Both are checked,
 * and either failure copies the address so the path stays usable.
 */

export type ContactOutcome =
  | { kind: 'opened' }
  | { kind: 'copied'; address: string };

export async function openSupportMail(subject: string, body?: string): Promise<ContactOutcome> {
  const url = supportMailUrl(subject, body);
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return { kind: 'opened' };
    }
  } catch {
    // Fall through to the clipboard: the reason the mail client refused does
    // not change what we can offer instead.
  }

  await Clipboard.setStringAsync(SUPPORT_ADDRESS);
  return { address: SUPPORT_ADDRESS, kind: 'copied' };
}
