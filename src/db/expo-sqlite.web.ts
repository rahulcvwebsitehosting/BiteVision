/**
 * Web shim for `expo-sqlite`, wired up in `metro.config.js`.
 *
 * The web build has no persistence by design — the root layout treats storage
 * as optional, so opening simply rejects and the app renders without a
 * database, exactly like the native path that never connects.
 */
export type SQLiteDatabase = unknown;

export function openDatabaseAsync(): Promise<never> {
  return Promise.reject(new Error('expo-sqlite is not available on the web.'));
}
