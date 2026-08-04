-- A guest needs a name, not an e-mail address.
--
-- `public.guests` carries `email_or_phone_required`, CHECK (email is not null
-- or phone is not null). That is a rule from the retired web product, where an
-- invitation was delivered by e-mail and a guest with no address could not be
-- reached at all.
--
-- The mobile product delivers through the per-guest RSVP link, which the owner
-- copies and sends over whatever messenger they already use. E-mail and phone
-- are optional notes on the guest, not the delivery channel — which is what
-- `manage_invitation_guest` already implements: it raises `guest_name_required`
-- and nothing else, and it deliberately writes NULL for a blank address.
--
-- The constraint therefore rejected the app's most ordinary action. Adding a
-- guest by name only failed with a raw Postgres constraint error, which is not
-- in the client's server-message map, so the screen showed the user the
-- database's own English string. CSV import failed the same way for any file
-- without an e-mail column, which the importer explicitly supports.
--
-- Found by the owner leg of the pre-release access matrix.
--
-- Dropping a CHECK is non-destructive: every existing row already satisfies it.

begin;

alter table public.guests drop constraint if exists email_or_phone_required;

commit;
