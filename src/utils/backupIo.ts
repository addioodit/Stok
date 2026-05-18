import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { BackupFile, buildBackup, validateBackup } from '../data/backup';

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Write the current app data to a JSON file and open the system share
 * sheet so the user can save it to Files, email it to themselves, etc.
 */
export async function exportBackup(): Promise<void> {
  const json = JSON.stringify(buildBackup(), null, 2);
  const uri = `${FileSystem.cacheDirectory}stok-backup-${todayStamp()}.json`;
  await FileSystem.writeAsStringAsync(uri, json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your Stok backup',
    UTI: 'public.json',
  });
}

export type ImportResult =
  | { status: 'cancelled' }
  | { status: 'ok'; backup: BackupFile }
  | { status: 'error'; error: string };

/**
 * Let the user pick a backup file, then read + validate it. Does NOT apply
 * the backup — the caller confirms with the user first, then calls
 * applyBackup().
 */
export async function pickBackup(): Promise<ImportResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) {
    return { status: 'cancelled' };
  }

  try {
    const content = await FileSystem.readAsStringAsync(picked.assets[0].uri);
    const parsed: unknown = JSON.parse(content);
    const result = validateBackup(parsed);
    if (!result.ok) {
      return { status: 'error', error: result.error };
    }
    return { status: 'ok', backup: result.backup };
  } catch {
    return {
      status: 'error',
      error: "Couldn't read that file as a Stok backup.",
    };
  }
}
