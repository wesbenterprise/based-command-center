import type { ProviderAdapter, ArenaRequest, ArenaResponse } from './types';

export class GoogleAdapter implements ProviderAdapter {
  async call(request: ArenaRequest): Promise<ArenaResponse> {
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_STUDIO_KEY not set');

    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.modelString}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google AI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokenCountIn = data.usageMetadata?.promptTokenCount ?? 0;
    const tokenCountOut = data.usageMetadata?.candidatesTokenCount ?? 0;

    return { responseText, tokenCountIn, tokenCountOut, latencyMs };
  }
}
