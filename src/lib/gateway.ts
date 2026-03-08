const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

export class GatewayOfflineError extends Error {
  constructor() {
    super('Gateway Offline');
    this.name = 'GatewayOfflineError';
  }
}

export async function gatewayFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new GatewayOfflineError();
  }
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json();
}
