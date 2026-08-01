import {
  estimateWithOpenAICompat,
  verifyOpenAICompatKey,
} from '@/api/openaiCompat';
import { providerConfig } from '@/api/providers';

/**
 * Mistral transport.
 *
 * The Studio free tier plus a multimodal small model makes Mistral a no-cost
 * option. Mistral accepts OpenAI `response_format: json_object`, which keeps
 * the reply a bare JSON object the shared parser can read directly.
 */

const CONFIG = providerConfig('mistral');

export async function estimateWithMistral(
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

export async function verifyMistralKey(apiKey: string): Promise<void> {
  return verifyOpenAICompatKey({
    endpoint: CONFIG.endpoint,
    model: CONFIG.model,
    apiKey,
    jsonMode: false,
  });
}
