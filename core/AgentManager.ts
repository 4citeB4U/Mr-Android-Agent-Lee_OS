import { AgentBase, AgentAction } from './AgentBase';
import { AgentLeeBT } from '../agents/AgentLeeBT';

export class AgentManager {
  agents: AgentBase[];
  worldState: Record<string, any>;

  constructor() {
    this.agents = [new AgentLeeBT('lee', 'Agent Lee')];
    this.worldState = {};
  }

  async handleEvent(event: any) {
    for (const agent of this.agents) {
      let action = agent.decide(event, this.worldState);
      // If agent requests LLM assistance, call LLMProvider
      if (action && action.type === 'llm_assist' && window.LLMProvider) {
        action.llmResult = await window.LLMProvider.generate(action.prompt);
      }
      this.executeAction(agent, action);
    }
  }

  executeAction(agent: AgentBase, action: AgentAction) {
    // Route to UI, update world, call tools, etc.
    // For now, just log
    console.log(`[${agent.name}] Action:`, action);
  }
}
