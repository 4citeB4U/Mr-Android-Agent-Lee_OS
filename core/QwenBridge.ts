/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.INFERENCE.QWEN
TAG: CORE.INFERENCE.QWEN.BRIDGE

COLOR_ONION_HEX:
NEON=#FFB800
FLUO=#FFCD00
PASTEL=#FFE082

ICON_ASCII:
family=lucide
glyph=brain

5WH:
WHAT = Qwen Local Inference Bridge — routes Agent Lee requests to local Qwen model
WHY = Provides fast local inference without cloud API calls; reduces latency and cost
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/QwenBridge.ts
WHEN = 2026
HOW = REST API to local Qwen (via Ollama, LM Studio, or vLLM); no cloud fallback

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import { eventBus } from './EventBus';

export interface QwenConfig {
  baseUrl: string; // e.g., 'http://localhost:11434' for Ollama
  model: string; // e.g., 'qwen:7b'
  temperature: number;
  maxTokens: number;
  timeout: number; // ms
}

export enum QwenStatus {
  UNKNOWN = 'unknown',
  CONNECTING = 'connecting',
  ONLINE = 'online',
  OFFLINE = 'offline',
}

/**
 * QwenBridge - Routes inference requests to local Qwen model
 * Provides health checking only (no fallback)
 */
export class QwenBridge {
  private static instance: QwenBridge | null = null;
  private config: QwenConfig;
  private status: QwenStatus = QwenStatus.UNKNOWN;
  private healthCheckInterval: number | null = null;
  private lastHealthCheck: number = 0;
  private requestCount: number = 0;
  private errorCount: number = 0;

  private constructor(config: Partial<QwenConfig> = {}) {
    this.config = {
      baseUrl: (import.meta.env.VITE_QWEN_API_URL as string) || 'http://localhost:11434',
      model: (import.meta.env.VITE_LOCAL_MODEL as string) || 'qwen2.5vl:3b',
      temperature: 0.7,
      maxTokens: 256,
      timeout: 30000, // 30 seconds
      ...config,
    };
  }

  static getInstance(config?: Partial<QwenConfig>): QwenBridge {
    if (!QwenBridge.instance) {
      QwenBridge.instance = new QwenBridge(config);
    }
    return QwenBridge.instance;
  }

  /**
   * Initialize and check health
   */
  async initialize(): Promise<void> {
    console.log('[QwenBridge] Initializing Qwen at', this.config.baseUrl);
    this.status = QwenStatus.CONNECTING;
    eventBus.emit('qwen:status-change', { status: this.status });

    try {
      await this.healthCheck();
      this.status = QwenStatus.ONLINE;
      console.log('[QwenBridge] Qwen is online and ready');
      eventBus.emit('qwen:status-change', { status: this.status });

      // Start periodic health checks
      this.startHealthChecks();
    } catch (error) {
      this.status = QwenStatus.OFFLINE;
      console.warn('[QwenBridge] Qwen is offline:', error);
      eventBus.emit('qwen:status-change', { status: this.status });
    }
  }

  /**
   * Check if Qwen is accessible
   */
  private async healthCheck(): Promise<void> {
    if (Date.now() - this.lastHealthCheck < 5000) {
      return; // Skip if checked recently
    }

    this.lastHealthCheck = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000,
      } as any);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json() as { models: Array<{ name: string }> };
      const hasModel = data.models?.some(m => m.name.includes(this.config.model.split(':')[0]));

      if (!hasModel) {
        console.warn(
          `[QwenBridge] Model ${this.config.model} not found. Available:`,
          data.models?.map(m => m.name)
        );
      }
    } catch (error) {
      throw new Error(`Qwen health check failed: ${error}`);
    }
  }

  /**
   * Periodically check Qwen health
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) return;
    this.healthCheckInterval = window.setInterval(async () => {
      try {
        await this.healthCheck();
        if (this.status === QwenStatus.OFFLINE) {
          this.status = QwenStatus.ONLINE;
          eventBus.emit('qwen:status-change', { status: this.status });
          console.log('[QwenBridge] Qwen is back online');
        }
      } catch (error) {
        if (this.status === QwenStatus.ONLINE) {
          this.status = QwenStatus.OFFLINE;
          eventBus.emit('qwen:status-change', { status: this.status });
          console.warn('[QwenBridge] Qwen went offline');
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate response using Qwen model
   * Implements Ollama API format (compatible with LM Studio, vLLM, etc.)
   */
  async generate(
    input: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    if (this.status === QwenStatus.OFFLINE) {
      throw new Error('Qwen is offline');
    }

    this.requestCount++;

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // Add system prompt
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    } else {
      messages.push({
        role: 'system',
        content: `You are Agent Lee, a helpful and knowledgeable AI assistant. 
You respond concisely and directly. 
Keep responses to 1-3 sentences unless asked for more detail.`,
      });
    }

    // Add conversation history
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }

    // Add current input
    messages.push({ role: 'user', content: input });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
        signal: controller.signal,
      } as any);

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`);
      }

      const data = await response.json() as {
        message?: { content: string };
        response?: string;
      };
      const content = data.message?.content || data.response || '';

      if (!content) {
        throw new Error('Empty response from Qwen');
      }

      eventBus.emit('qwen:response-generated', {
        input,
        output: content,
        model: this.config.model,
        requestCount: this.requestCount,
      });

      return content.trim();
    } catch (error) {
      this.errorCount++;
      console.error('[QwenBridge] Generation failed:', error);
      eventBus.emit('qwen:error', {
        error: error instanceof Error ? error.message : String(error),
        input,
        requestCount: this.requestCount,
        errorCount: this.errorCount,
      });
      throw error;
    }
  }

  /**
   * Streaming generation (optional, for real-time response)
   */
  async *generateStream(
    input: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): AsyncGenerator<string> {
    if (this.status === QwenStatus.OFFLINE) {
      throw new Error('Qwen is offline');
    }

    this.requestCount++;

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (conversationHistory) {
      messages.push(...conversationHistory);
    }

    messages.push({ role: 'user', content: input });

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as { message?: { content: string } };
              if (data.message?.content) {
                yield data.message.content;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      this.errorCount++;
      console.error('[QwenBridge] Streaming generation failed:', error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus(): QwenStatus {
    return this.status;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      status: this.status,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
    };
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('[QwenBridge] Shut down');
  }
}

export default QwenBridge;
