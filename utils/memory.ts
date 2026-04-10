// Simple agent memory utility
export class AgentMemory {
  private memory: string[] = [];

  add(entry: string) {
    this.memory.push(entry);
  }

  recall(limit = 5): string[] {
    return this.memory.slice(-limit);
  }
}
