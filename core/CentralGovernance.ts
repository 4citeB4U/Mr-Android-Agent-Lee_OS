// CentralGovernance.ts
// Unified governance enforcement for the entire Agent Lee OS

import { eventBus } from './EventBus';

export type GovernanceDomain = 'agent' | 'worker' | 'llm' | 'file' | 'workflow' | 'database' | 'ui';
// Extended to match all fileOps actions
export type GovernanceAction = 'read' | 'write' | 'execute' | 'transfer' | 'delete' | 'approve' | 'audit' | 'create' | 'update';

export interface GovernanceRequest {
  domain: GovernanceDomain;
  action: GovernanceAction;
  actor: string; // agent, user, or system
  resource: string; // file, workflow, db, etc
  context?: Record<string, any>;
}

export interface GovernanceResult {
  allowed: boolean;
  reason?: string;
  policy: string;
}

// Example: Centralized policy table
const POLICY_TABLE: Record<GovernanceDomain, Record<GovernanceAction, { allowed: boolean; policy: string; }>> = {
  agent:    { read: { allowed: true, policy: 'open' }, write: { allowed: false, policy: 'immutable' }, execute: { allowed: true, policy: 'approved' }, transfer: { allowed: false, policy: 'restricted' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  worker:   { read: { allowed: true, policy: 'open' }, write: { allowed: true, policy: 'approved' }, execute: { allowed: true, policy: 'approved' }, transfer: { allowed: false, policy: 'restricted' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  llm:      { read: { allowed: true, policy: 'open' }, write: { allowed: false, policy: 'immutable' }, execute: { allowed: true, policy: 'approved' }, transfer: { allowed: false, policy: 'restricted' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  file:     { read: { allowed: true, policy: 'open' }, write: { allowed: true, policy: 'approved' }, execute: { allowed: false, policy: 'forbidden' }, transfer: { allowed: true, policy: 'approved' }, delete: { allowed: true, policy: 'approved' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  workflow: { read: { allowed: true, policy: 'open' }, write: { allowed: true, policy: 'approved' }, execute: { allowed: true, policy: 'approved' }, transfer: { allowed: false, policy: 'restricted' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  database: { read: { allowed: true, policy: 'open' }, write: { allowed: true, policy: 'approved' }, execute: { allowed: false, policy: 'forbidden' }, transfer: { allowed: false, policy: 'restricted' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: true, policy: 'council' }, audit: { allowed: true, policy: 'always' } },
  ui:       { read: { allowed: true, policy: 'open' }, write: { allowed: false, policy: 'immutable' }, execute: { allowed: false, policy: 'forbidden' }, transfer: { allowed: false, policy: 'forbidden' }, delete: { allowed: false, policy: 'immutable' }, approve: { allowed: false, policy: 'forbidden' }, audit: { allowed: true, policy: 'always' } },
};

export function enforceGovernance(req: GovernanceRequest): GovernanceResult {
  const domainPolicy = POLICY_TABLE[req.domain]?.[req.action];
  if (!domainPolicy) {
    return { allowed: false, reason: 'No policy defined', policy: 'undefined' };
  }
  // Emit for audit
  eventBus.emit('governance:check', { ...req, ...domainPolicy });
  return { allowed: domainPolicy.allowed, policy: domainPolicy.policy };
}
