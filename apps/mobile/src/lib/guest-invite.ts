/*
 * Building the links and messages a host sends to guests.
 *
 * Pure, and kept apart from the code that opens them, so the fiddly parts —
 * phone normalisation above all — can be tested without React Native in the
 * runner. Turkish numbers arrive written every way a person might write one
 * ("0532 123 45 67", "+90 532 123 45 67", "(532) 123-4567") and WhatsApp accepts
 * exactly one of them.
 */

/** WhatsApp wants digits only, in full international form, with no leading plus. */
const TURKISH_MOBILE_LENGTH = 10;
const TURKEY_DIALLING_CODE = '90';

/**
 * Puts a written phone number into the form WhatsApp's click-to-chat expects.
 * Returns null when what is left cannot be a number, so the caller falls back to
 * a channel that does not need one rather than opening a broken chat.
 */
export function normalizePhone(raw: string | null | undefined, diallingCode = TURKEY_DIALLING_CODE): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  const hadPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  // An explicit +90 is already international; so is a bare 90XXXXXXXXXX.
  if (hadPlus) return digits.length >= 8 ? digits : null;
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    return digits.length >= 8 ? digits : null;
  }

  // Domestic forms: a trunk zero, or the bare subscriber number.
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === TURKISH_MOBILE_LENGTH) return `${diallingCode}${digits}`;
  if (digits.startsWith(diallingCode) && digits.length === TURKISH_MOBILE_LENGTH + diallingCode.length) return digits;

  // Long enough to be some other country's number written without a plus.
  return digits.length >= 11 ? digits : null;
}

/** The guest's own RSVP page. One per guest — it is how their answer is attributed. */
export function rsvpLink(guestToken: string, origin: string | null) {
  const path = `/rsvp/${encodeURIComponent(guestToken)}`;
  return origin ? `${origin}${path}` : `davetim:/${path}`;
}

/** The invitation itself, the same for everyone. */
export function invitationLink(invitationId: string, origin: string | null) {
  const path = `/i/${encodeURIComponent(invitationId)}`;
  return origin ? `${origin}${path}` : `davetim:/${path}`;
}

/**
 * What the host actually sends. Addressed by name, because a bare link in a chat
 * window reads as spam, and the guest is being asked to tap something that will
 * record an answer under their name.
 */
export function inviteMessage({
  eventDate,
  guestName,
  link,
  title,
}: {
  eventDate?: string | null;
  guestName: string;
  link: string;
  title: string;
}) {
  const greeting = guestName.trim() ? `Sayın ${guestName.trim()},` : 'Merhaba,';
  const occasion = eventDate?.trim() ? `${title} · ${eventDate.trim()}` : title;
  return `${greeting}\n\n${occasion} davetimize bekliyoruz. Davetiyeyi görüntülemek ve katılım durumunuzu bildirmek için:\n${link}`;
}

/** WhatsApp click-to-chat. A null phone means "no chat to open". */
export function whatsappUrl(phone: string | null | undefined, text: string) {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * An SMS with the message already written. iOS separates the body with `&`,
 * Android with `?`; getting it wrong opens the composer with the body pasted
 * into the recipient field.
 */
export function smsUrl(phone: string | null | undefined, text: string, platform: 'android' | 'ios') {
  const number = normalizePhone(phone);
  if (!number) return null;
  const separator = platform === 'ios' ? '&' : '?';
  return `sms:+${number}${separator}body=${encodeURIComponent(text)}`;
}

/**
 * Every guest's personal link as one pasteable block, for a host who would
 * rather work through them in their own mail client or spreadsheet.
 */
export function inviteLinkList(guests: { fullName: string; guestToken: string }[], origin: string | null) {
  return guests.map((guest) => `${guest.fullName}: ${rsvpLink(guest.guestToken, origin)}`).join('\n');
}
