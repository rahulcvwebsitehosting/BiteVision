import type { Provider } from '@/api/keyStore';

/**
 * Provider registry. The single place that knows each provider's transport,
 * default model, endpoint, JSON-mode support, where to get a key, and whether
 * the tier is free. Both the vision facade (`vision.ts`) and the key-entry UI
 * read from here, so adding a provider is "add a row" rather than threading.
 */

export interface ProviderConfig {
  id: Provider;
  /** Short, UI-friendly name. */
  label: string;
  /** Where the request goes. Anthropic and Gemini keep their own transports. */
  transport: 'anthropic' | 'gemini' | 'openai_compat';
  /** Model id the request is sent with. */
  model: string;
  /** Chat-completions endpoint for the `openai_compat` transport. Unused otherwise. */
  endpoint: string;
  /**
   * Whether the provider accepts OpenAI `response_format: { type: "json_object" }`.
   * On for Mistral; off for NVIDIA (llama-3.2-vision reports structured output
   * unsupported) and Zen (mixed backends). The shared parser strips prose, so
   * JSON mode is a nice-to-have, not a requirement.
   */
  jsonMode: boolean;
  /** Where the user signs up / copies a key. */
  keyUrl: string;
  /** True if there is a genuinely free tier that can do vision. */
  free: boolean;
  /** One-line clarification shown in the UI when the "free" claim has caveats. */
  note?: string;
  /**
   * A regex matched against the key (trimmed) to sanity-check the shape before
   * the network round trip. Permissive — the test call is the real authority.
   */
  keyShape: RegExp;
}

export const PROVIDERS: readonly ProviderConfig[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    transport: 'gemini',
    model: 'gemini-flash-latest',
    endpoint: '',
    jsonMode: false,
    keyUrl: 'https://aistudio.google.com/apikey',
    free: true,
    keyShape: /^(AIza|AQ\.)[A-Za-z0-9_.\-]{10,}$/,
  },
  {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    transport: 'openai_compat',
    // 90B vision model on NVIDIA's free inference tier (40 RPM, no billing).
    model: 'meta/llama-3.2-90b-vision-instruct',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    jsonMode: false,
    keyUrl: 'https://build.nvidia.com',
    free: true,
    note: 'Free to prototype (40 requests/min).',
    keyShape: /^nvapi-[A-Za-z0-9_\-]{8,}$/,
  },
  {
    id: 'mistral',
    label: 'Mistral',
    transport: 'openai_compat',
    // Multimodal; `mistral-small-latest` is the free-tier alias for the small
    // vision-capable model family.
    model: 'mistral-small-latest',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    jsonMode: true,
    keyUrl: 'https://console.mistral.ai',
    free: true,
    note: 'Free Studio tier.',
    keyShape: /^[A-Za-z0-9]{20,}$/,
  },
  {
    id: 'zen',
    label: 'OpenCode Zen',
    transport: 'openai_compat',
    // Cheapest multimodal model on Zen. Zen's free models are text/code only,
    // so vision goes through a paid model — priced in cents per million tokens.
    model: 'gpt-5.6-luna',
    endpoint: 'https://opencode.ai/zen/v1/chat/completions',
    jsonMode: false,
    keyUrl: 'https://opencode.ai/auth',
    free: false,
    note: 'Pay-as-you-go. Free Zen models have no vision; this uses a low-cost multimodal model.',
    keyShape: /^[A-Za-z0-9_\-]{20,}$/,
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    transport: 'anthropic',
    model: 'claude-sonnet-4-6',
    endpoint: '',
    jsonMode: false,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    free: false,
    keyShape: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
  },
] as const;

export function providerConfig(id: Provider): ProviderConfig {
  const found = PROVIDERS.find((provider) => provider.id === id);
  if (!found) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return found;
}
