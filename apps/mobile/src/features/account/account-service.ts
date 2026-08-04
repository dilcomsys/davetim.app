import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { assertBackendWritesEnabled } from '@/config/feature-flags';
import { RemoteDataError } from '@/lib/remote-data';
import { requireSupabaseClient } from '@/lib/supabase';

export async function updateProfile(fullName: string) {
  assertBackendWritesEnabled();
  const normalizedName = fullName.trim();
  if (normalizedName.length < 2 || normalizedName.length > 100) throw new RemoteDataError('Ad soyad 2 ile 100 karakter arasında olmalıdır.');
  const { error } = await requireSupabaseClient().auth.updateUser({ data: { full_name: normalizedName } });
  if (error) throw new RemoteDataError('Profil güncellenemedi.', error);
}

export async function exportAccountData() {
  const { data, error } = await requireSupabaseClient().functions.invoke('export-account-data');
  if (error) throw new RemoteDataError('Hesap verileri dışa aktarılamadı.', error);
  if (!(await Sharing.isAvailableAsync())) throw new RemoteDataError('Dosya paylaşımı bu cihazda kullanılamıyor.');
  const file = new File(Paths.cache, `davetim-verilerim-${Date.now()}.json`);
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { dialogTitle: 'Davetim hesap verileri', mimeType: 'application/json', UTI: 'public.json' });
}

export async function requestAccountDeletion() {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().functions.invoke('request-account-deletion', { body: { confirmation: 'DELETE_MY_ACCOUNT' } });
  if (error) throw new RemoteDataError('Hesap silme talebi oluşturulamadı.', error);
}
