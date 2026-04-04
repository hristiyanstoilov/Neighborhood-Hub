import * as SecureStore from 'expo-secure-store'

export const Storage = {
  get: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  delete: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
}
