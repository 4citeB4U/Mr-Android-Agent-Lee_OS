// VerificationTest.ts
// Phase 4: Local Reasoning Engine verification
import { reasoningStage } from './core/execution/ExecutionLayer.ts';
import { PerceptionBus } from './core/PerceptionBus.ts';

async function runVerificationTest() {
  // Simulate intent: code (DB schema fix)
  const req = {
    intent: 'code',
    prompt: 'Agent Lee, fix the typo in my DB schema.'
  };
  // Fire intelligence spike event for visualization
  const bus = PerceptionBus.getInstance();
  bus.publish({
    id: 'inference_test',
    type: 'inference',
    source: 'VerificationTest',
    timestamp: Date.now(),
    payload: { model: 'qwen2.5-coder:1.5b' }
  });
  // Run reasoning
  await reasoningStage(req);
}

runVerificationTest();
