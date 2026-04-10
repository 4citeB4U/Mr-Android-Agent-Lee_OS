// Simple rule engine for agent decisions
export function evaluateRules(event, agent, world) {
  // Example: hardcoded rules
  if (event.type === 'greet') {
    return { type: 'say', text: `Greetings from ${agent.name}!` };
  }
  // Add more rules or import from scripts/agent_behaviors
  return { type: 'idle' };
}
