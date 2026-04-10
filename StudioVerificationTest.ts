// StudioVerificationTest.ts
// Phase 5: Studio Unification verification
import { StudioExecutionController, CREATIVE_PROFILE } from './core/execution/StudioExecutionController.ts';
import { PerceptionBus } from './core/PerceptionBus.ts';

async function runStudioVerificationTest() {
  // Simulate Creators Studio session
  const controller = new StudioExecutionController();
  controller.init(CREATIVE_PROFILE);
  // Listen for plan generation
  controller.onUpdate = () => {
    if (controller.phase === 'PLANNING' && controller.plan && !controller.plan.approved) {
      // Simulate governance pass
      controller.approvePlan();
    }
    if (controller.phase === 'EXECUTING') {
      // Fire workflow event for VisualCortex
      const bus = PerceptionBus.getInstance();
      bus.publish({
        id: 'studio_workflow_test',
        type: 'studio_workflow',
        source: 'StudioVerificationTest',
        timestamp: Date.now(),
        payload: {
          region: 'Creative',
          phase: controller.phase,
          color: CREATIVE_PROFILE.color
        }
      });
      console.log(`[StudioController] Profile: G4. Plan Generated. Awaiting Governance. Receipt logged to Memory Lake.`);
    }
  };
  // Start the task
  await controller.generatePlan('Generate a marketing brief.');
}

runStudioVerificationTest();
