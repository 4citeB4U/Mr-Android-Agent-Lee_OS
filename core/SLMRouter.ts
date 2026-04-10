// core/SLMRouter.ts
// 55MB-safe SLM routing: Ollama → Browser → leeway
// Priority: Try Ollama first, fall back to browser Phi-2, then leeway cloud


import { eventBus } from './EventBus';



// Supported Ollama models as governed execution tools
const OLLAMA_MODELS = {
  vision: 'qwen2.5vl:3b',
  coder: 'qwen2.5-coder:1.5b',
  default: 'llama3.2-vision',
};

export type ModelTool = 'vision' | 'coder' | 'default';

export class SLMRouter {
  private ollamaUrl = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';

  /**
   * Main entry: Governed model tool execution
   * @param prompt - user/system prompt
   * @param options - generation options
   * @param modelTool - which model tool to use (gemma, vision, coder, default)
   */
  async generate(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number },
    modelTool: ModelTool = 'default'
  ): Promise<string> {
    eventBus.emit('agent:active', { agent: 'Router', task: `Processing query [${modelTool}]` });
    // Only use Ollama models
    try {
      const result = await this.generateWithModel(prompt, modelTool, options);
      console.log(`[SLMRouter] Using Ollama (${modelTool})`);
      eventBus.emit('agent:done', {
        agent: 'Router',
        result: `Using Ollama (${modelTool}) - fast inference`
      });
      return result;
    } catch (ollamaErr) {
      console.warn(`[SLMRouter] Ollama [${modelTool}] unavailable:`, ollamaErr);
      throw new Error('Ollama model unavailable');
    }
  }

  /**
   * Explicit governed model tool execution
   */
  async generateWithModel(
    prompt: string,
    modelTool: ModelTool,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const model = OLLAMA_MODELS[modelTool] || OLLAMA_MODELS.default;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(this.ollamaUrl + 'api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 256
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Ollama error');
      const data = await response.json();
      return data.response || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  // ...existing code...
}

export const slmRouter = new SLMRouter();

