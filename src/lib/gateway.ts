// Gateway access via local Next.js API proxy routes
// These routes shell out to `openclaw` CLI for real data when running locally
// On Vercel, they return cached snapshots from Supabase

export class GatewayOfflineError extends Error {
  constructor() {
    super('Gateway Offline');
    this.name = 'GatewayOfflineError';
  }
}

export async function gatewayFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  // Route through local Next.js API proxy
  const proxyPath = `/api/gateway${path.replace(/^\/api/, '')}`;
  let res: Response;
  try {
    res = await fetch(proxyPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new GatewayOfflineError();
  }
  if (!res.ok) {
    if (res.status === 503) throw new GatewayOfflineError();
    throw new Error(`Gateway error: ${res.status}`);
  }
  return res.json();
}
