import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function saveToStorage(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getFromStorage(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Failed to get from localStorage', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function deleteFromStorage(key: string) {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to delete from localStorage', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}