/*
 * The analytics event catalogue.
 *
 * Every event the app can send is named here rather than typed as a string at
 * the call site. Two reasons, both of which cost real data when ignored:
 *
 *  - Firebase silently drops anything that breaks its naming rules. A typo, a
 *    dash, a name over 40 characters — no error, no event, and you find out
 *    weeks later when the funnel has a hole in it. `assertValidEvent` below
 *    encodes those rules so a bad name fails a test instead of a dashboard.
 *  - A catalogue is the only place you can read what the product actually
 *    measures. Scattered string literals answer "was this tracked?" only by
 *    grepping and hoping.
 *
 * Parameter values are truncated, never rejected: losing the tail of a long
 * template name is better than losing the event.
 */

export const ANALYTICS_EVENTS = {
  // Lifecycle and identity
  appOpened: 'app_opened',
  signedUp: 'sign_up',
  signedIn: 'login',
  signedOut: 'sign_out',
  accountDeletionRequested: 'account_deletion_requested',
  accountDataExported: 'account_data_exported',

  // Discovery
  templateListFiltered: 'template_list_filtered',
  templateSearched: 'template_searched',
  templateOpened: 'template_opened',
  templateFavorited: 'template_favorited',
  blankDesignStarted: 'blank_design_started',

  // Editor
  editorOpened: 'editor_opened',
  editorElementAdded: 'editor_element_added',
  editorDecorationAdded: 'editor_decoration_added',
  editorAlignUsed: 'editor_align_used',
  editorBackgroundUploaded: 'editor_background_uploaded',
  invitationSaved: 'invitation_saved',
  invitationPublished: 'invitation_published',
  invitationUnpublished: 'invitation_unpublished',

  // Distribution
  invitationShared: 'invitation_shared',
  invitationLinkCopied: 'invitation_link_copied',
  invitationExported: 'invitation_exported',
  invitationLifecycleAction: 'invitation_lifecycle_action',

  // Guests and RSVP
  guestAdded: 'guest_added',
  guestsImported: 'guests_imported',
  guestsExported: 'guests_exported',
  rsvpLinkCopied: 'rsvp_link_copied',
  guestInviteSent: 'guest_invite_sent',
  guestInvitesShared: 'guest_invites_shared',
  rsvpSubmitted: 'rsvp_submitted',

  // QR media
  mediaGalleryCreated: 'media_gallery_created',
  mediaGalleryShared: 'media_gallery_shared',
  guestMediaUploaded: 'guest_media_uploaded',

  // Monetisation
  rewardedAdRequested: 'rewarded_ad_requested',
  rewardedAdGranted: 'rewarded_ad_granted',
  rewardedAdFailed: 'rewarded_ad_failed',

  // Prompts
  updatePromptShown: 'update_prompt_shown',
  updatePromptAccepted: 'update_prompt_accepted',
  updatePromptDismissed: 'update_prompt_dismissed',
  reviewPromptShown: 'review_prompt_shown',

  // Notifications
  notificationsEnabled: 'notifications_enabled',
  notificationsDeclined: 'notifications_declined',
  notificationOpened: 'notification_opened',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

// Firebase's documented limits. Names: <=40 chars, letters/digits/underscore,
// must start with a letter, and the three reserved prefixes are rejected.
const NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const RESERVED_PREFIXES = ['firebase_', 'google_', 'ga_'];
const MAX_PARAM_NAME = 40;
const MAX_PARAM_VALUE = 100;

export function isValidEventName(name: string) {
  if (!NAME_PATTERN.test(name)) return false;
  return !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Drops unusable parameters and truncates long values. Analytics must never be
 * the reason a screen throws, so this cleans rather than rejects.
 */
export function sanitizeParams(params: AnalyticsParams | undefined): Record<string, string | number | boolean> {
  if (!params) return {};
  const cleaned: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (!NAME_PATTERN.test(key) || key.length > MAX_PARAM_NAME) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      cleaned[key] = trimmed.slice(0, MAX_PARAM_VALUE);
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue;
      cleaned[key] = value;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}
