import type { ProviderAdapter } from './types';
import { AnthropicAdapter } from './anthropic';
import { OpenAIAdapter } from './openai';
import { GoogleAdapter } from './google';
import { XAIAdapter } from './xai';
import { OllamaAdapter } from './ollama';

export function getAdapter(provider: string): ProviderAdapter {
  switch (provider) {
    case 'anthropic': return new AnthropicAdapter();
    case 'openai': return new OpenAIAdapter();
    case 'google': return new GoogleAdapter();
    case 'xai': return new XAIAdapter();
    case 'ollama': return new OllamaAdapter();
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

export type { ProviderAdapter };
export type { ArenaRequest, ArenaResponse } from './types';
