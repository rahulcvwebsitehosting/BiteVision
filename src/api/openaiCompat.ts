import { VisionError } from '@/api/errors';
import { KEY_CHECK_PROMPT, SYSTEM_PROMPT, USER_PROMPT } from '@/api/prompt';

/**
 * Shared OpenAI `chat/completions` transport.
 *
 * NVIDIA NIM, Mistral and OpenCode Zen all speak this shape: a `messages` array
 * whose user turn can carry an `image_url` part as a base64 data URI. Each
 * provider module owns its endpoint, model and quirks (e.g. JSON mode); this
 * module owns the fetch, timeout, abort and error mapping so none of that is
 * duplicated.
 */

const TIMEOUT_MS = 30_000;

const DATA_URI = `data:image/jpeg;base64,`;

export interface OpenAICompatConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  /** Whether the provider accepts `response_format: { type: "json_object" }`. */
  jsonMode: boolean;
}

interface OpenAIResult {
  choices?: { message?: { content?: string } }[];
}

/** Sends the image and returns the model's raw text (expected to be JSON). */
export async function estimateWithOpenAICompat(
  cfg: OpenAICompatConfig,
  base64Jpeg: string,
  signal?: AbortSignal,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `${DATA_URI}${base64Jpeg}` } },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  };
  if (cfg.jsonMode) {
    body['response_format'] = { type: 'json_object' };
  }

  const response = await post(cfg, body, signal);
  const text = firstContent(response);
  if (!text) {
    throw new VisionError('malformed', 'The estimate came back empty.');
  }
  return text;
}

/** One-token round trip used by the "Test key" button. */
export async function verifyOpenAICompatKey(cfg: OpenAICompatConfig): Promise<void> {
  await post(
    cfg,
    {
      model: cfg.model,
      max_tokens: 1,
      messages: [{ role: 'user', content: KEY_CHECK_PROMPT }],
    },
    undefined,
  );
}

async function post(
  cfg: OpenAICompatConfig,
  body: unknown,
  signal: AbortSignal | undefined,
): Promise<OpenAIResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new VisionError(
        signal?.aborted ? 'cancelled' : 'timeout',
        signal?.aborted ? 'Estimate cancelled.' : 'The estimate timed out.',
      );
    }
    throw new VisionError('network', 'Could not reach the service.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) {
    throw await errorForResponse(response);
  }

  try {
    return (await response.json()) as OpenAIResult;
  } catch {
    throw new VisionError('malformed', 'The estimate could not be read.');
  }
}

async function errorForResponse(response: Response): Promise<VisionError> {
  const status = response.status;
  let apiMessage = '';
  try {
    const parsed = (await response.json()) as { error?: { message?: string } };
    apiMessage = parsed.error?.message ?? '';
  } catch {
    // No JSON body; fall back to status alone.
  }

  if (isBillingMessage(apiMessage)) {
    return new VisionError('billing', 'This account has no API credits.');
  }
  if (status === 401 || status === 403) {
    return new VisionError('unauthorized', 'Your API key was rejected.');
  }
  if (status === 429) {
    return new VisionError('rate_limited', 'Rate limited.');
  }
  if (status >= 500) {
    return new VisionError('server', 'The service is unavailable.');
  }
  return new VisionError(
    'malformed',
    apiMessage || `The request was rejected (${status}).`,
  );
}

function isBillingMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('credit balance') ||
    lower.includes('billing') ||
    lower.includes('purchase credits') ||
    lower.includes('insufficient') ||
    lower.includes('payment required')
  );
}

function firstContent(response: OpenAIResult): string | null {
  const content = response.choices?.[0]?.message?.content;
  return typeof content === 'string' && content.trim().length > 0
    ? content.trim()
    : null;
}
