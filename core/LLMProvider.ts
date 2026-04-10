// Simple LLMProvider interface for optional LLM assistance
export const LLMProvider = {
  async generate(prompt: string): Promise<string> {
    // Replace with actual LLM call (browser or server)
    return 'LLM response for: ' + prompt;
  }
};

// Attach to window for AgentManager fallback
if (typeof window !== 'undefined') {
  (window as any).LLMProvider = LLMProvider;
}
