import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo/token-cache';

/**
 * Clerk token cache using Expo SecureStore (Keychain on iOS, Keystore on Android).
 * Tokens are stored encrypted on-device — never in AsyncStorage.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // silently fail — user will re-authenticate
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};
