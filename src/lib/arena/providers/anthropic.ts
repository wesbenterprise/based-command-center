import type { ProviderAdapter, ArenaRequest, ArenaResponse } from './types';

export class AnthropicAdapter implements ProviderAdapter {
  async call(request: ArenaRequest): Promise<ArenaResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const start = Date.now();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.modelString,
        max_tokens: 4096,
        messages: [{ role: 'user', content: request.prompt }],
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const responseText = data.content?.[0]?.text ?? '';
    const tokenCountIn = data.usage?.input_tokens ?? 0;
    const tokenCountOut = data.usage?.output_tokens ?? 0;

    return { responseText, tokenCountIn, tokenCountOut, latencyMs };
  }
}
