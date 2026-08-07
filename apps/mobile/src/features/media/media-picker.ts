import * as ImagePicker from 'expo-image-picker';

import type { LocalMediaFile } from '@/features/media/media-service';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { readFileSize } from '@/lib/local-file';
import { RemoteDataError } from '@/lib/remote-data';

function inferMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLocaleLowerCase('en-US');
  const types: Record<string, string> = {
    heic: 'image/heic',
    heif: 'image/heif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    mov: 'video/quicktime',
    mp4: 'video/mp4',
    png: 'image/png',
    webm: 'video/webm',
    webp: 'image/webp',
  };
  return extension ? types[extension] ?? 'application/octet-stream' : 'application/octet-stream';
}

async function pickFile(mediaTypes: ('images' | 'videos')[]): Promise<LocalMediaFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new RemoteDataError('Fotoğraf ve video seçmek için medya arşivi izni gerekiyor.');

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    mediaTypes,
    quality: 0.9,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const fallbackName = `davetim-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
  const fileName = asset.fileName || fallbackName;
  return {
    fileName,
    // The picker reports a size on both platforms; measuring the file is only
    // the fallback, and a size of zero is caught by validation downstream.
    fileSize: asset.fileSize ?? await readFileSize(asset.uri) ?? 0,
    mimeType: asset.mimeType || inferMimeType(fileName),
    uri: asset.uri,
  };
}

export function pickMediaFile() {
  return pickFile(['images', 'videos']);
}

export function pickImageFile() {
  return pickFile(['images']);
}
