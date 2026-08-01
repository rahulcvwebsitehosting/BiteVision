import {
  estimateWithOpenAICompat,
  verifyOpenAICompatKey,
} from '@/api/openaiCompat';
import { providerConfig } from '@/api/providers';

/**
 * OpenCode Zen transport.
 *
 * Zen is a pay-as-you-go gateway that re-sells several providers behind one
 * key. Its free models are text/code only, so vision goes through a low-cost
 * multimodal model — see `providers.ts`. The shape is the OpenAI
 * chat-completions contract with a base64 image_url part.
 */

const CONFIG = providerConfig('zen');

export async function estimateWithZen(
  apiKey: string,
  base64Jpeg: string,
  signal?: AbortSignal,
): Promise<string> {
  return estimateWithOpenAICompat(
    { endpoint: CONFIG.endpoint, model: CONFIG.model, apiKey, jsonMode: CONFIG.jsonMode },
    base64Jpeg,
    signal,
  );
}

export async function verifyZenKey(apiKey: string): Promise<void> {
  return verifyOpenAICompatKey({
    endpoint: CONFIG.endpoint,
    model: CONFIG.model,
    apiKey,
    jsonMode: false,
  });
}
