export interface ModelConfig {
  id: string;
  displayName: string;
  provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'ollama';
  modelString: string;
  enabled: boolean;
  defaultLatencyMs: number;
}

export const MODEL_REGISTRY: ModelConfig[] = [
  // Anthropic
  { id: 'claude-haiku', displayName: 'Claude Haiku', provider: 'anthropic', modelString: 'claude-haiku-4-5-20251001', enabled: true, defaultLatencyMs: 5000 },
  { id: 'claude-sonnet', displayName: 'Claude Sonnet', provider: 'anthropic', modelString: 'claude-sonnet-4-20250514', enabled: true, defaultLatencyMs: 10000 },
  { id: 'claude-opus', displayName: 'Claude Opus', provider: 'anthropic', modelString: 'claude-opus-4-20250514', enabled: true, defaultLatencyMs: 20000 },

  // OpenAI
  { id: 'gpt-4o', displayName: 'GPT-4o', provider: 'openai', modelString: 'gpt-4o', enabled: true, defaultLatencyMs: 10000 },
  { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'openai', modelString: 'gpt-4o-mini', enabled: true, defaultLatencyMs: 5000 },
  { id: 'o1', displayName: 'o1', provider: 'openai', modelString: 'o1', enabled: true, defaultLatencyMs: 30000 },
  { id: 'o3', displayName: 'o3', provider: 'openai', modelString: 'o3', enabled: true, defaultLatencyMs: 30000 },

  // Google (AI Studio)
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'google', modelString: 'gemini-2.5-pro-preview-05-06', enabled: true, defaultLatencyMs: 12000 },
  { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', provider: 'google', modelString: 'gemini-2.5-flash-preview-05-20', enabled: true, defaultLatencyMs: 5000 },

  // xAI
  { id: 'grok', displayName: 'Grok', provider: 'xai', modelString: 'grok-3', enabled: true, defaultLatencyMs: 10000 },

  // Ollama (remote machine)
  { id: 'qwen', displayName: 'Qwen (Local)', provider: 'ollama', modelString: 'qwen2.5:latest', enabled: false, defaultLatencyMs: 15000 },
];

export function getModelById(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find(m => m.id === id);
}
