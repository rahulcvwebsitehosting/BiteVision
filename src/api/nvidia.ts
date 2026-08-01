import {
  estimateWithOpenAICompat,
  verifyOpenAICompatKey,
} from '@/api/openaiCompat';
import { providerConfig } from '@/api/providers';

/**
 * NVIDIA NIM transport.
 *
 * Uses NVIDIA's free inference endpoint (`integrate.api.nvidia.com`) with the
 * Llama 3.2 90B vision model. The free tier is rate-limited (40 RPM) but not
 * billed, which makes it a genuine no-cost option for photo estimates.
 */

const CONFIG = providerConfig('nvidia');

export async function estimateWithNvidia(
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

export async function verifyNvidiaKey(apiKey: string): Promise<void> {
  return verifyOpenAICompatKey({
    endpoint: CONFIG.endpoint,
    model: CONFIG.model,
    apiKey,
    jsonMode: false,
  });
}
