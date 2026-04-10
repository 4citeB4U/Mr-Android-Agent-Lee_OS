// core/execution/StudioExecutionController.ts
import { OllamaModel, generateWithOllama } from './OllamaAdapter.ts';

export type StudioLifecyclePhase = 'IDLE' | 'INTAKE' | 'PLANNING' | 'EXECUTING' | 'VERIFYING' | 'ARCHIVING';

export interface StudioProfile {
  id: string;
  label: string;
  cortex: string;
  model: OllamaModel;
  logic: string[];
  color: string;
}

export const CODE_PROFILE: StudioProfile = {
  id: 'G3',
  label: 'Code Studio',
  cortex: 'Build',
  model: OllamaModel.CODER,
  logic: ['ts-morph', 'BugHunter'],
  color: '#00bcd4'
};

export const CREATIVE_PROFILE: StudioProfile = {
  id: 'G4',
  label: 'Creators Studio',
  cortex: 'Creative',
  model: OllamaModel.QWEN_VL,
  logic: ['template-generator', 'Pixel', 'Aria'],
  color: '#e040fb'
};

export const DEPLOYMENT_PROFILE: StudioProfile = {
  id: 'G6',
  label: 'Deployment Hub',
  cortex: 'Deployment',
  model: OllamaModel.CODER,
  logic: ['release-checklist', 'Nexus', 'Shield'],
  color: '#43a047'
};

export interface StudioTaskPlan {
  plan: string;
  approved: boolean;
}

export class StudioExecutionController {
  public phase: StudioLifecyclePhase = 'IDLE';
  public profile: StudioProfile | null = null;
  public plan: StudioTaskPlan | null = null;
  public onUpdate: (() => void) | null = null;

  init(profile: StudioProfile) {
    this.profile = profile;
    this.phase = 'INTAKE';
    this.plan = null;
    this.emit();
  }

  async generatePlan(prompt: string) {
    if (!this.profile) throw new Error('No profile set');
    this.phase = 'PLANNING';
    this.emit();
    // Use qwen2.5-coder for plan generation
    const response = await generateWithOllama({
      model: OllamaModel.CODER,
      prompt: `[Studio Plan] ${prompt}`
    });
    this.plan = { plan: response.response, approved: false };
    this.phase = 'PLANNING';
    this.emit();
    console.log(`[StudioController] Profile: ${this.profile.id}. Plan Generated. Awaiting Governance. Receipt logged to Memory Lake.`);
  }

  approvePlan() {
    if (!this.plan) throw new Error('No plan to approve');
    this.plan.approved = true;
    this.phase = 'EXECUTING';
    this.emit();
  }

  completeExecution() {
    this.phase = 'VERIFYING';
    this.emit();
  }

  archive() {
    this.phase = 'ARCHIVING';
    this.emit();
  }

  reset() {
    this.phase = 'IDLE';
    this.profile = null;
    this.plan = null;
    this.emit();
  }

  emit() {
    if (this.onUpdate) this.onUpdate();
  }
}
