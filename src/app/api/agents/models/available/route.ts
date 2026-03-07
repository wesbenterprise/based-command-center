import { NextResponse } from 'next/server';

const ALLOWED_MODELS = [
  { value: 'anthropic/claude-opus-4-6', label: 'Claude Opus 4.6', tier: 'premium' },
  { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6', tier: 'standard' },
  { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', tier: 'fast' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'premium' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)', tier: 'premium' },
  { value: 'xai/grok-4', label: 'Grok 4 (Big Brain)', tier: 'premium' },
  { value: 'xai/grok-3', label: 'Grok 3', tier: 'standard' },
  { value: 'xai/grok-3-fast', label: 'Grok 3 Fast (Workhorse)', tier: 'fast' },
];

export async function GET() {
  return NextResponse.json(ALLOWED_MODELS);
}
