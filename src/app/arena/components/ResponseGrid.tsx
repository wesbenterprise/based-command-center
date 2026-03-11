'use client';

import ResponsePanel from './ResponsePanel';
import { ModelConfig } from '@/lib/arena/registry';

interface ResponseData {
  provider: string;
  model_name: string;
  model_display_name: string;
  response_text?: string | null;
  latency_ms?: number | null;
  token_count_in?: number | null;
  token_count_out?: number | null;
  error?: string | null;
}

interface Props {
  models: ModelConfig[];
  running: boolean;
  responses: ResponseData[];
  latencyEstimates: Record<string, number>;
}

export default function ResponseGrid({ models, running, responses, latencyEstimates }: Props) {
  if (models.length === 0) return null;

  const cols = models.length;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
    }}>
      {models.map(m => {
        const resp = responses.find(r => r.model_name === m.modelString) ?? null;
        const estimated = latencyEstimates[m.modelString] ?? m.defaultLatencyMs;
        return (
          <ResponsePanel
            key={m.id}
            modelId={m.id}
            displayName={m.displayName}
            provider={m.provider}
            estimatedMs={estimated}
            running={running}
            response={resp}
          />
        );
      })}
    </div>
  );
}
