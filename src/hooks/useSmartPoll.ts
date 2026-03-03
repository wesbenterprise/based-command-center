'use client';
import { useEffect, useRef, useCallback } from 'react';

interface UseSmartPollOptions {
  intervalMs?: number;
  enabled?: boolean;
  immediate?: boolean;
}

export function useSmartPoll(
  callback: () => void | Promise<void>,
  options: UseSmartPollOptions = {}
): { refetch: () => void } {
  const { intervalMs = 30000, enabled = true, immediate = true } = options;
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const refetch = useCallback(() => { cbRef.current(); }, []);

  useEffect(() => {
    if (!enabled) return;
    if (immediate) cbRef.current();
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (timer) return; timer = setInterval(() => cbRef.current(), intervalMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => {
      if (document.hidden) { stop(); } else { cbRef.current(); start(); }
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [intervalMs, enabled, immediate]);

  return { refetch };
}
