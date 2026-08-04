import { useCallback, useEffect, useState } from 'react';

// The RPCs raise short identifiers (`raise exception 'invitation_incomplete'`)
// and supabase-js surfaces them verbatim as the error message. Without this
// map every failure collapsed into the caller's generic sentence, so the user
// was told "could not publish" while the server knew the event date was
// missing.
//
// Edge Function failures are not covered: supabase-js reports those as a
// generic FunctionsHttpError without reading the body, so those keep the
// caller's message.
const serverMessages: Record<string, string> = {
  confirmation_required: 'Onay metnini tam olarak yazmanız gerekiyor.',
  consent_required: 'Yükleme için içerik paylaşım onayını vermelisiniz.',
  document_too_large: 'Tasarım çok büyük. Bazı öğeleri kaldırıp tekrar deneyin.',
  file_too_large: 'Dosya izin verilen boyutu aşıyor.',
  gallery_unavailable: 'Galeri kapalı veya erişim süresi dolmuş.',
  guest_id_required: 'Davetli seçilmedi.',
  guest_limit_reached: 'Bir davette en fazla 500 davetli olabilir.',
  guest_name_required: 'Davetli adı zorunludur.',
  guest_not_found: 'Davetli bulunamadı.',
  guest_upload_limit_reached: 'Bu galeri için yükleme sınırına ulaşıldı.',
  invalid_email: 'E-posta adresi geçerli görünmüyor.',
  invalid_event_date: 'Tarihi YYYY-AA-GG biçiminde girin. Örnek: 2026-09-12',
  invalid_event_time: 'Saati SS:DD biçiminde girin. Örnek: 19:30',
  invalid_guest_count: 'Bir dosyada 1 ile 500 arasında davetli bulunmalıdır.',
  invalid_image_url: 'Görsel adresi geçersiz.',
  invalid_status: 'Geçersiz yanıt seçildi.',
  invalid_token: 'Bağlantı geçersiz görünüyor.',
  invitation_incomplete: 'Yayınlamak için davet başlığı ve etkinlik tarihi gerekli.',
  invitation_not_found: 'Davet bulunamadı veya bu davete erişiminiz yok.',
  invitation_quota_reached: 'En fazla 25 aktif davetiniz olabilir. Kullanmadıklarınızı arşivleyin.',
  media_not_found: 'Galeri bulunamadı.',
  no_valid_guest_rows: 'Dosyada geçerli davetli satırı bulunamadı.',
  not_authenticated: 'Bu işlem için oturum açmanız gerekiyor.',
  rate_limited: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.',
  reauthentication_required: 'Güvenlik için tekrar giriş yapmanız gerekiyor.',
  rewarded_ads_disabled: 'Ödüllü reklamlar şu anda kapalı.',
  rsvp_unavailable: 'Bu davet artık yanıt kabul etmiyor.',
  template_not_available: 'Bu şablon artık kullanılamıyor.',
  template_requires_reward: 'Bu şablonu açmak için önce ödüllü reklamı izlemelisiniz.',
  ticket_not_found: 'Yükleme oturumu sona erdi. Lütfen tekrar deneyin.',
  unsupported_action: 'Bu işlem desteklenmiyor.',
  unsupported_feature: 'Bu ödül desteklenmiyor.',
  unsupported_kind: 'Bu dosya türü desteklenmiyor.',
  unsupported_mime: 'Bu dosya biçimi desteklenmiyor.',
  uploaded_object_missing: 'Yükleme tamamlanamadı. Lütfen tekrar deneyin.',
  uploaded_object_rejected: 'Yüklenen dosya doğrulanamadı. Lütfen tekrar deneyin.',
};

function serverMessage(cause: unknown) {
  if (!cause || typeof cause !== 'object' || !('message' in cause)) return null;
  const code = String((cause as { message: unknown }).message).trim();
  return serverMessages[code] ?? null;
}

export class RemoteDataError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(serverMessage(cause) ?? message);
    this.name = 'RemoteDataError';
  }
}

/*
 * `reload` and `refresh` run the same fetch and differ only in what the screen
 * is allowed to show while it runs. `reload` is a cold load and clears the view
 * down to a spinner; `refresh` keeps the current rows on screen and reports
 * through `refreshing`, which is what a pull gesture or a return to a tab
 * expects. Refreshing over the top of stale rows is the difference between
 * "still here, checking" and "everything vanished".
 */
export function useRemoteData<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState({ key: 0, quiet: false });

  const reload = useCallback(() => setRequest((value) => ({ key: value.key + 1, quiet: false })), []);
  const refresh = useCallback(() => setRequest((value) => ({ key: value.key + 1, quiet: true })), []);

  const quiet = request.quiet;

  useEffect(() => {
    let active = true;
    if (!enabled) return () => {
      active = false;
    };

    async function load() {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (active) setData(result);
      } catch (nextError) {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Veriler yüklenemedi.');
      } finally {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      }
    }

    void Promise.resolve().then(load);
    return () => {
      active = false;
    };
  }, [enabled, loader, quiet, request.key]);

  return { data, error, loading, refresh, refreshing, reload };
}
