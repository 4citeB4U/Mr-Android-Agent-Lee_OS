// dbOps.ts
// Universal DB operation wrapper for governance, audit, and traceability (Leeway 5W+H)

import { enforceGovernance } from './CentralGovernance';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface DBOpMeta {
  id: string;
  layer: string;
  function: string;
  operation: string;
  actor: string;
  resource: string;
  when: string;
  where: string;
  why: string;
  how: string;
  details?: any;
}

export function logDBOp(meta: DBOpMeta) {
  const logDir = path.join(__dirname, '../logs', meta.layer);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${meta.function}_${meta.id}.json`);
  fs.writeFileSync(logFile, JSON.stringify(meta, null, 2));
}

export async function dbOpWrapper({
  layer,
  functionName,
  operation,
  actor,
  resource,
  where,
  why,
  how,
  details,
  op,
}: {
  layer: string;
  functionName: string;
  operation: string;
  actor: string;
  resource: string;
  where: string;
  why: string;
  how: string;
  details?: any;
  op: () => Promise<any>;
}) {
  const id = `dbop_${uuidv4()}`;
  const when = new Date().toISOString();
  const meta: DBOpMeta = {
    id, layer, function: functionName, operation, actor, resource, when, where, why, how, details
  };
  // Governance enforcement
  const gov = enforceGovernance({
    domain: 'database',
    action: operation as any,
    actor,
    resource,
    context: meta,
  });
  if (!gov.allowed) throw new Error(`Governance block: ${gov.policy} - ${gov.reason}`);
  // Log before operation
  logDBOp(meta);
  // Execute operation
  const result = await op();
  // Optionally log after operation (with result)
  return result;
}
