import * as SecureStore from 'expo-secure-store';

// API-ключ хранится в защищённом хранилище устройства (Keychain / Keystore),
// а не в общем состоянии приложения.
const KEY = 'anthropic_api_key';

export async function getApiKey() {
  try {
    return (await SecureStore.getItemAsync(KEY)) || '';
  } catch (e) {
    return '';
  }
}

export async function saveApiKey(value) {
  const v = String(value || '').trim();
  if (!v) return SecureStore.deleteItemAsync(KEY);
  return SecureStore.setItemAsync(KEY, v);
}
