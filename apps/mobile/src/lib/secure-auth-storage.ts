import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800;
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

type Manifest = { count: number; id: string };

function manifestKey(key: string) {
  return `${key}.manifest`;
}

function chunkKey(key: string, id: string, index: number) {
  return `${key}.${id}.${index}`;
}

function parseManifest(value: string | null): Manifest | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const candidate = parsed as Record<string, unknown>;
    return typeof candidate.id === 'string' && Number.isInteger(candidate.count) && Number(candidate.count) > 0
      ? { count: Number(candidate.count), id: candidate.id }
      : null;
  } catch {
    return null;
  }
}

async function removeGeneration(key: string, manifest: Manifest | null) {
  if (!manifest) return;
  await Promise.all(Array.from({ length: manifest.count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, manifest.id, index))));
}

const nativeStorage: SupportedStorage = {
  async getItem(key) {
    const manifest = parseManifest(await SecureStore.getItemAsync(manifestKey(key)));
    if (manifest) {
      const chunks = await Promise.all(Array.from({ length: manifest.count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, manifest.id, index))));
      if (chunks.some((chunk) => chunk === null)) return null;
      return chunks.join('');
    }

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue) {
      await nativeStorage.setItem(key, legacyValue);
      await AsyncStorage.removeItem(key);
    }
    return legacyValue;
  },
  async removeItem(key) {
    const manifest = parseManifest(await SecureStore.getItemAsync(manifestKey(key)));
    await removeGeneration(key, manifest);
    await Promise.all([
      SecureStore.deleteItemAsync(manifestKey(key)),
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ]);
  },
  async setItem(key, value) {
    const previous = parseManifest(await SecureStore.getItemAsync(manifestKey(key)));
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) ?? [''];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, id, index), chunk, options)));
    await SecureStore.setItemAsync(manifestKey(key), JSON.stringify({ count: chunks.length, id }), options);
    await removeGeneration(key, previous);
    await AsyncStorage.removeItem(key);
  },
};

export const authStorage: SupportedStorage = Platform.OS === 'web' ? AsyncStorage : nativeStorage;
