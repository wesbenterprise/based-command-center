'use client';

import { useEffect, useState, useRef } from 'react';

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#D97706',
  openai: '#10B981',
  google: '#3B82F6',
  xai: '#EF4444',
  ollama: '#8B5CF6',
};

interface Props {
  provider: string;
  estimatedMs: number;
  running: boolean;
  completed: boolean;
}

export default function ProgressTimer({ provider, estimatedMs, running, completed }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const color = PROVIDER_COLORS[provider] ?? '#6366F1';

  useEffect(() => {
    if (running && !completed) {
      startRef.current = Date.now();
      const tick = () => {
        setElapsed(Date.now() - (startRef.current ?? Date.now()));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [running, completed]);

  const pct = completed ? 100 : Math.min(95, (elapsed / estimatedMs) * 100);
  const elapsedSec = (elapsed / 1000).toFixed(1);
  const estimatedSec = (estimatedMs / 1000).toFixed(0);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        position: 'relative',
        height: 6,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: completed ? 'width 0.3s ease' : 'width 0.1s linear',
          boxShadow: `0 0 8px ${color}88`,
        }} />
        {/* Estimated marker */}
        {!completed && (
          <div style={{
            position: 'absolute',
            left: '95%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.2)',
          }} />
        )}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
        fontSize: 11,
        fontFamily: 'var(--font-heading)',
      }}>
        <span style={{ color }}>{elapsedSec}s</span>
        {!completed && (
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>~{estimatedSec}s est.</span>
        )}
      </div>
    </div>
  );
}
