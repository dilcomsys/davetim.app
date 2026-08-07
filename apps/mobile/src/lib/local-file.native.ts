import { File } from 'expo-file-system';

import type { ReadFileBytes, ReadFileSize } from '@/lib/local-file-types';
import { RemoteDataError } from '@/lib/remote-data';

export const readFileBytes: ReadFileBytes = async (uri) => {
  try {
    return await new File(uri).bytes();
  } catch (error) {
    throw new RemoteDataError('Dosya okunamadı.', error);
  }
};

export const readFileSize: ReadFileSize = async (uri) => {
  // `size` is a synchronous getter that throws for a path the app cannot reach,
  // and a missing size is not worth failing an upload over.
  try {
    return new File(uri).size ?? null;
  } catch {
    return null;
  }
};
