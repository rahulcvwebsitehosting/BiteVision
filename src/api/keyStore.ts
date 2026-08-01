import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { providerConfig } from '@/api/providers';

/**
 * The only module that touches the Anthropic API key.
 *
 * The key lives in the device Keychain / Keystore via `expo-secure-store`. It is
 * never written to SQLite, never put in a Zustand store, never logged, and never
 * included in the JSON export. Everything else in the app asks for it here, at
 * call time, and lets it go immediately.
 *
 * There are two ways a key gets in:
 *
 *   1. The user pastes it — during onboarding or in Settings. This is the path
 *      that matters for anyone running a published build.
 *   2. `SNAP_DEV_ANTHROPIC_API_KEY` in a local `.env`, surfaced through
 *      `app.config.ts` (see `.env.example`). This is a development convenience:
 *      the value is inlined into the JS bundle, so it must be left unset when
 *      publishing. On first launch it is copied into secure storage once and
 *      never read again.
 */

const STORAGE_KEY = 'anthropic_api_key';
const PROVIDER_STORAGE_KEY = 'vision_provider';
const SEEDED_FLAG = 'anthropic_api_key_seeded';

function bundledDevKey(): string | null {
  const value = Constants.expoConfig?.extra?.['devApiKey'];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

/**
 * Syncs the `.env` key (`SNAP_DEV_ANTHROPIC_API_KEY`, via app.config.ts) into
 * secure storage. When present it is treated as authoritative and written on
 * every launch, so a key baked into a development build "just works" with no
 * onboarding key step. Leave the env var unset when publishing — users then
 * supply their own key in-app, and this is a no-op.
 *
 * `SEEDED_FLAG` is still cleared/kept only for backwards compatibility with
 * older installs; the env key now wins whenever it is set.
 */
export async function seedFromEnvironment(): Promise<void> {
  const devKey = bundledDevKey();
  if (!devKey) return;

  const existing = await SecureStore.getItemAsync(STORAGE_KEY);
  if (existing !== devKey) {
    await SecureStore.setItemAsync(STORAGE_KEY, devKey);
  }
  // The bundled dev key is an Anthropic key (see .env.example); write the
  // provider so the dispatcher never has to rely on prefix inference for it.
  await SecureStore.setItemAsync(PROVIDER_STORAGE_KEY, 'anthropic');
  await SecureStore.setItemAsync(SEEDED_FLAG, 'true');
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export async function hasApiKey(): Promise<boolean> {
  return (await getApiKey()) !== null;
}

/**
 * Stores the key together with the provider it belongs to. The provider is
 * needed because two of the providers (Mistral, Zen) have keys with no
 * recognisable prefix, so it cannot be recovered from the key alone.
 */
export async function setApiKey(
  value: string,
  provider: Provider,
): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, value.trim());
  await SecureStore.setItemAsync(PROVIDER_STORAGE_KEY, provider);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
  await SecureStore.deleteItemAsync(PROVIDER_STORAGE_KEY);
}

/** `sk-ant-…4f2a` or `nvapi-…a3b2` — enough to recognise a key, not use one. */
export function maskKey(value: string): string {
  if (value.length <= 12) return '••••••••';
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}

export async function maskedApiKey(): Promise<string | null> {
  const key = await getApiKey();
  return key ? maskKey(key) : null;
}

export type Provider = 'anthropic' | 'gemini' | 'nvidia' | 'mistral' | 'zen';

const ALL_PROVIDERS: readonly Provider[] = [
  'anthropic',
  'gemini',
  'nvidia',
  'mistral',
  'zen',
];

function isProvider(value: string | null): value is Provider {
  return value !== null && (ALL_PROVIDERS as readonly string[]).includes(value);
}

/**
 * The provider the current key belongs to. Returns the stored choice, or — for a
 * pre-multi-provider install that has a key but no stored provider — falls
 * back to inferring it from the key prefix.
 */
export async function getProvider(): Promise<Provider> {
  const stored = await SecureStore.getItemAsync(PROVIDER_STORAGE_KEY);
  if (isProvider(stored)) return stored;
  const key = await getApiKey();
  return key ? providerForKey(key) : 'gemini';
}

/**
 * Which service a key belongs to, inferred from its prefix. Only used to bring
 * forward keys from older installs that have no stored provider; new keys
 * carry the provider explicitly via `setApiKey`.
 */
export function providerForKey(value: string): Provider {
  const trimmed = value.trim();
  if (trimmed.startsWith('sk-ant-')) return 'anthropic';
  if (trimmed.startsWith('nvapi-')) return 'nvidia';
  return 'gemini';
}

/**
 * Shape check only — a real check costs a request (see `verifyApiKey` in
 * `src/api/vision.ts`). The shape is taken from the provider registry, so each
 * provider validates against its own key pattern. Passing the provider is
 * required because keys without a prefix (Mistral, Zen) cannot be told apart
 * from each other by shape alone.
 */
export function looksLikeApiKey(value: string, provider: Provider): boolean {
  const trimmed = value.trim();
  const shape = providerConfig(provider).keyShape;
  return shape.test(trimmed);
}
