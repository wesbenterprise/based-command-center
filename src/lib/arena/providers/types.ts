export interface ArenaRequest {
  prompt: string;
  modelString: string;
}

export interface ArenaResponse {
  responseText: string;
  tokenCountIn: number;
  tokenCountOut: number;
  latencyMs: number;
}

export interface ProviderAdapter {
  call(request: ArenaRequest): Promise<ArenaResponse>;
}
