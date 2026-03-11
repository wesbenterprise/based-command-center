'use client';

import { useState, useEffect, useCallback } from 'react';
import ModelSelector from './components/ModelSelector';
import PromptInput from './components/PromptInput';
import ResponseGrid from './components/ResponseGrid';
import RunHistory from './components/RunHistory';
import SavedPrompts from './components/SavedPrompts';
import { MODEL_REGISTRY, ModelConfig } from '@/lib/arena/registry';

interface ResponseData {
  id: string;
  run_id: string;
  provider: string;
  model_name: string;
  model_display_name: string;
  response_text?: string | null;
  latency_ms?: number | null;
  token_count_in?: number | null;
  token_count_out?: number | null;
  error?: string | null;
}

interface HistoryRun {
  id: string;
  prompt_text: string;
  selected_models: string[];
  status: string;
  created_at: string;
}

interface SavedPrompt {
  id: string;
  title: string;
  prompt_text: string;
  tags: string[];
  updated_at: string;
}

type BottomTab = 'history' | 'saved';

export default function ArenaPage() {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(['claude-sonnet']);
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [currentResponses, setCurrentResponses] = useState<ResponseData[]>([]);
  const [activeModels, setActiveModels] = useState<ModelConfig[]>([]);

  const [historyRuns, setHistoryRuns] = useState<HistoryRun[]>([]);
  const [historyResponses, setHistoryResponses] = useState<Record<string, ResponseData[]>>({});
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [latencyEstimates, setLatencyEstimates] = useState<Record<string, number>>({});

  const [bottomTab, setBottomTab] = useState<BottomTab>('history');
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/history?limit=20');
      const data = await res.json();
      if (data.runs) setHistoryRuns(data.runs);
      if (data.responses) setHistoryResponses(data.responses);
    } catch {}
  }, []);

  const loadSavedPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/prompts');
      const data = await res.json();
      if (data.prompts) setSavedPrompts(data.prompts);
    } catch {}
  }, []);

  const loadLatency = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/latency');
      const data = await res.json();
      if (data.latencies) {
        const map: Record<string, number> = {};
        for (const row of data.latencies) {
          map[row.model_name] = row.avg_latency_ms;
        }
        setLatencyEstimates(map);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadHistory();
    loadSavedPrompts();
    loadLatency();
  }, [loadHistory, loadSavedPrompts, loadLatency]);

  const handleRun = async () => {
    if (!prompt.trim() || selectedModelIds.length === 0 || running) return;

    const models = MODEL_REGISTRY.filter(m => selectedModelIds.includes(m.id));
    setActiveModels(models);
    setCurrentResponses([]);
    setRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/arena/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), models: selectedModelIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Run failed');
      } else {
        setCurrentResponses(data.responses ?? []);
        loadHistory();
        loadLatency();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setRunning(false);
    }
  };

  const handleSavePrompt = async (title: string, tags: string[]) => {
    try {
      const res = await fetch('/api/arena/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, prompt_text: prompt.trim(), tags }),
      });
      if (res.ok) {
        loadSavedPrompts();
        setBottomTab('saved');
      }
    } catch {}
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await fetch('/api/arena/prompts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadSavedPrompts();
    } catch {}
  };

  const handleUpdatePrompt = async (id: string, updates: Partial<SavedPrompt>) => {
    try {
      await fetch('/api/arena/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      loadSavedPrompts();
    } catch {}
  };

  const handleNewPrompt = () => {
    setPrompt('');
    setBottomTab('saved');
  };

  const showResponseArea = activeModels.length > 0;

  return (
    <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%', color: '#F1F5F9' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          letterSpacing: '0.12em',
          margin: 0,
          color: '#F1F5F9',
        }}>
          ⚔️ PROMPT ARENA
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)' }}>
          Run a single prompt against up to 3 AI models simultaneously
        </p>
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: 16 }}>
        <ModelSelector selected={selectedModelIds} onChange={setSelectedModelIds} />
      </div>

      {/* Prompt Input */}
      <div style={{ marginBottom: 24 }}>
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onRun={handleRun}
          onSave={handleSavePrompt}
          canRun={prompt.trim().length > 0 && selectedModelIds.length > 0}
          running={running}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 6,
          color: '#FCA5A5',
          fontSize: 13,
          fontFamily: 'var(--font-heading)',
        }}>
          Error: {error}
        </div>
      )}

      {/* Response Grid */}
      {showResponseArea && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginBottom: 10,
          }}>
            RESPONSES
          </div>
          <ResponseGrid
            models={activeModels}
            running={running}
            responses={currentResponses}
            latencyEstimates={latencyEstimates}
          />
        </div>
      )}

      {/* Bottom Panel: History + Saved */}
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {(['history', 'saved'] as BottomTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: bottomTab === tab ? '2px solid #D97706' : '2px solid transparent',
                color: bottomTab === tab ? '#F1F5F9' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.1em',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase',
              }}
            >
              {tab === 'history' ? `History (${historyRuns.length})` : `Saved (${savedPrompts.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '8px 4px', maxHeight: 400, overflowY: 'auto' }}>
          {bottomTab === 'history' && (
            <RunHistory
              runs={historyRuns}
              responses={historyResponses}
              onLoadPrompt={text => { setPrompt(text); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          )}
          {bottomTab === 'saved' && (
            <SavedPrompts
              prompts={savedPrompts}
              onLoad={text => { setPrompt(text); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onDelete={handleDeletePrompt}
              onUpdate={handleUpdatePrompt}
              onNew={handleNewPrompt}
            />
          )}
        </div>
      </div>
    </main>
  );
}
