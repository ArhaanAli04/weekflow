import * as SecureStore from 'expo-secure-store';
import type { StorageAdapter } from '@weekflow/shared/lib/storage';

export const nativeStorageAdapter: StorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
