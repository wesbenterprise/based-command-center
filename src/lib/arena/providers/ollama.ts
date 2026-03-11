import type { ProviderAdapter, ArenaRequest, ArenaResponse } from './types';

export class OllamaAdapter implements ProviderAdapter {
  async call(request: ArenaRequest): Promise<ArenaResponse> {
    const host = process.env.OLLAMA_HOST || 'localhost';
    const url = `http://${host}:11434/api/generate`;

    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.modelString,
        prompt: request.prompt,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const responseText = data.response ?? '';
    const tokenCountIn = data.prompt_eval_count ?? 0;
    const tokenCountOut = data.eval_count ?? 0;

    return { responseText, tokenCountIn, tokenCountOut, latencyMs };
  }
}
