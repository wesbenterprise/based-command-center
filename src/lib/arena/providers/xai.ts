import { OpenAIAdapter } from './openai';

// xAI uses OpenAI-compatible API
export class XAIAdapter extends OpenAIAdapter {
  constructor() {
    super('https://api.x.ai/v1', 'XAI_API_KEY');
  }
}
