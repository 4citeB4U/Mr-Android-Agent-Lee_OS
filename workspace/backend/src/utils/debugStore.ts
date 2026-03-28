/**
 * Lightweight runtime debug store.
 * Allows exposing the recent reasoning, vision, and planning steps to a status panel.
 */

export const debugStore = {
  lastMobileContext: null as any,
  lastDecision: null as any,
  lastTaskPlan: null as any,
  lastSafetyPolicyResult: null as { action: string; policy: string; allowed: boolean; reason?: string } | null,
  lastMcpInvocation: null as { tool: string; args: any; timestamp: number } | null,
  
  updateContext(context: any) {
    this.lastMobileContext = context;
  },

  updateDecision(decision: any) {
    this.lastDecision = decision;
  },

  updateTaskPlan(taskName: string, status: string, details?: any) {
    this.lastTaskPlan = { taskName, status, details, timestamp: Date.now() };
  },

  updateSafetyPolicy(action: string, policy: string, reason?: string) {
    this.lastSafetyPolicyResult = { action, policy, allowed: policy === "allow", reason };
  },

  updateMcpInvocation(tool: string, args: any) {
    this.lastMcpInvocation = { tool, args, timestamp: Date.now() };
  },

  getDebugSnapshot() {
    return {
      lastMobileContext: this.lastMobileContext,
      lastDecision: this.lastDecision,
      lastTaskPlan: this.lastTaskPlan,
      lastSafetyPolicyResult: this.lastSafetyPolicyResult,
      lastMcpInvocation: this.lastMcpInvocation,
    };
  }
};
