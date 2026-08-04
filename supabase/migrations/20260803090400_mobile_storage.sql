-- Mobile contract: storage buckets.
--
-- Reconciled against the live project on 2026-08-03. Three buckets already
-- exist and are kept:
--   qr-media           private. Owner media and guest uploads. Delivered only
--                      through short-lived signed URLs.
--   invitation-images  public.  Already referenced by published invitations,
--                      so it stays public. New objects get random paths that
--                      contain no user identifier.
--   templates          public.  Template artwork.
--
-- Object *listing* is removed for all three in
-- 20260803090500_security_hardening.sql. A public bucket serves
-- /storage/v1/object/public/... without any RLS policy, so dropping the broad
-- SELECT policies stops enumeration without breaking existing image URLs.

begin;

update storage.buckets
set public = false,
    file_size_limit = 104857600,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/quicktime', 'video/webm'
    ]
where id = 'qr-media';

update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'invitation-images';

update storage.buckets
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'templates';

commit;
