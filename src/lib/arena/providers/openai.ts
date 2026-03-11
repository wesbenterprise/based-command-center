import type { ProviderAdapter, ArenaRequest, ArenaResponse } from './types';

export class OpenAIAdapter implements ProviderAdapter {
  private baseUrl: string;
  private apiKeyEnv: string;

  constructor(baseUrl = 'https://api.openai.com/v1', apiKeyEnv = 'OPENAI_API_KEY') {
    this.baseUrl = baseUrl;
    this.apiKeyEnv = apiKeyEnv;
  }

  async call(request: ArenaRequest): Promise<ArenaResponse> {
    const apiKey = process.env[this.apiKeyEnv];
    if (!apiKey) throw new Error(`${this.apiKeyEnv} not set`);

    const start = Date.now();
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.modelString,
        messages: [{ role: 'user', content: request.prompt }],
        max_completion_tokens: 4096,
      }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const responseText = data.choices?.[0]?.message?.content ?? '';
    const tokenCountIn = data.usage?.prompt_tokens ?? 0;
    const tokenCountOut = data.usage?.completion_tokens ?? 0;

    return { responseText, tokenCountIn, tokenCountOut, latencyMs };
  }
}
