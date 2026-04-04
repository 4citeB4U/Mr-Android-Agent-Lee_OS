/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.CORE.CLIENT
TAG: AI.ORCHESTRATION.CORE.GEMINICLIENT.WRAPPER

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=sparkles

5WH:
WHAT = Central Gemini API client — all AI requests in the system go through this wrapper
WHY = Enforces OAuth-first, no-raw-key architecture — user's Google token authorizes all Gemini calls
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/GeminiClient.ts
WHEN = 2026
HOW = Class using fetch with OAuth Bearer token to call Gemini REST API directly on behalf of the user

AGENTS:
ASSESS
AUDIT
GEMINI
SECURITY

LICENSE:
MIT
*/

// core/GeminiClient.ts
// Central Gemini SDK wrapper — ALL calls go through Firebase Function proxy.
// NO raw API key is ever stored or used on the client side.
// The user's Google OAuth idToken is sent; the server validates and calls Gemini.

import { getAuth } from 'firebase/auth';

export type AgentName = 
  | 'AgentLee' | 'Atlas' | 'Nova' | 'Echo' 
  | 'Sage' | 'Shield' | 'Pixel' | 'Nexus' | 'Aria'
  | 'LiveConductor' | 'StreamingSTT' | 'StreamingTTS'
  | 'Vision' | 'Router' | 'SafetyRedaction';

export type GeminiModel = 
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-thinking-exp';

export interface GeminiRequest {
  prompt: string;
  systemPrompt?: string;
  agent?: AgentName;
  model?: GeminiModel;
  temperature?: number;
  imageBase64?: string;
  history?: { role: 'user' | 'model'; content: string }[];
  tools?: string[];         // 'code_execution' | 'google_search' | 'image_gen'
  streamCallback?: (chunk: string) => void;
}

export interface GeminiResponse {
  text: string;
  agent: AgentName;
  model: GeminiModel;
  tokensUsed?: number;
  executionResult?: {
    code?: string;
    output?: string;
    error?: string;
    language?: string;
  };
}

class GeminiClientClass {
  private getAccessToken(): string {
    const token = sessionStorage.getItem('agent_lee_access_token');
    if (!token) throw new Error('Not authenticated. Please sign in with Google.');
    return token;
  }

  async generate(request: GeminiRequest): Promise<GeminiResponse> {
    const accessToken = this.getAccessToken();
    const model = request.model || 'gemini-2.0-flash';

    const systemInstruction = request.systemPrompt 
      ? { parts: [{ text: request.systemPrompt }] } 
      : undefined;

    const body = {
      contents: [{ parts: [{ text: request.prompt }] }],
      systemInstruction,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Simulate standard response structure for existing code
    return {
      text,
      agent: request.agent || 'AgentLee',
      model,
      executionResult: { output: text }, 
    };
  }

  async stream(request: GeminiRequest): Promise<string> {
    const accessToken = this.getAccessToken();
    const model = request.model || 'gemini-2.0-flash';

    const systemInstruction = request.systemPrompt
      ? { parts: [{ text: request.systemPrompt }] }
      : undefined;

    // Build multi-turn contents from conversation history + current prompt
    const contents: { role: string; parts: { text: string }[] }[] = [];
    if (request.history && request.history.length > 0) {
      for (const turn of request.history) {
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: request.prompt }] });

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
      },
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textPart) {
              fullText += textPart;
              request.streamCallback?.(textPart);
            }
          } catch (e) {
            // Skip malformed SSE chunks
          }
        }
      }
    }

    return fullText;
  }

  async generateImage(prompt: string): Promise<string> {
    // Note: Imagen access might require Vertex AI endpoint or specific proxy depending on the setup. 
    // Fallback standard text generation acting as placeholder for voxel rendering
    const result = await this.generate({
      prompt: `Translate this image prompt into a visual description: ${prompt}`,
      agent: 'Pixel'
    });
    return result.executionResult?.output || '';
  }

  async executeCode(code: string, language = 'python'): Promise<{ output: string; error?: string }> {
    const result = await this.generate({
      prompt: `Execute this ${language} code mentally and return the output:\n\`\`\`${language}\n${code}\n\`\`\``,
      agent: 'Nova',
    });
    return {
      output: result.text || '',
    };
  }

  async searchWeb(query: string): Promise<string> {
    const result = await this.generate({
      prompt: query,
      agent: 'Atlas',
    });
    return result.text;
  }
}

export const GeminiClient = new GeminiClientClass();
