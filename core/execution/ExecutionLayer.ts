// core/execution/ExecutionLayer.ts
// Execution layer with reasoning stage and model routing
import { generateWithOllama, OllamaModel } from './OllamaAdapter.ts';

export type IntentType = 'conversational' | 'vision' | 'code';

export interface ReasoningRequest {
  intent: IntentType;
  prompt: string;
  context?: any;
}

export interface Proposal {
  model: OllamaModel;
  result: string;
  approved: boolean;
}

// Governance contract stub
export const GovernanceContract = {
  validate: async (proposal: Proposal) => {
    // Add real validation logic here
    return { ...proposal, approved: true };
  }
};

export async function reasoningStage(req: ReasoningRequest): Promise<Proposal> {
  let model: OllamaModel;
  if (req.intent === 'conversational') model = OllamaModel.GEMMA;
  else if (req.intent === 'vision') model = OllamaModel.QWEN_VL;
  else if (req.intent === 'code') model = OllamaModel.CODER;
  else throw new Error('Unknown intent');

  console.log(`[ExecutionLayer] Reasoning via ${model}.`);
  const response = await generateWithOllama({ model, prompt: req.prompt });
  const proposal: Proposal = { model, result: response.response, approved: false };
  const validated = await GovernanceContract.validate(proposal);
  if (validated.approved) {
    if (model === 'qwen2.5-coder:1.5b') {
      console.log('[ExecutionLayer] Reasoning via qwen2.5-coder:1.5b. Proposal approved. Updating DatabaseHub.');
    }
  }
  return validated;
}
