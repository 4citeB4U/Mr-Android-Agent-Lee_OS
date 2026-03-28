// Minimal termuxTts service stub for Termux TTS support
export const termuxTtsService = {
  async getAvailableEngines() {
    return ['default'];
  },
  
  getEngine() {
    return 'default';
  },
  
  setEngine(engine: string) {
    // No-op
  },
  
  async speak(text: string, engine?: string) {
    // No-op
    return;
  }
};
