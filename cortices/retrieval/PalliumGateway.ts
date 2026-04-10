/*
 * Cortex: Retrieval — Pallium Gateway (migrated from core/PalliumGateway.ts)
 */

import { eventBus } from '../../core/EventBus';
import { v4 as uuidv4 } from 'uuid';

export interface PalliumRecord {
  id: string;
  type: 'agent_state' | 'memory' | 'task' | 'conversation' | 'document' | 'metadata';
  timestamp: number;
  userId?: string;
  agentId?: string;
  data: Record<string, any>;
  tags?: string[];
  source?: 'chroma' | 'milvus' | 'weaviate' | 'faiss' | 'pallium' | 'firebase';
  embedding?: number[];
  ttl?: number;
}

export interface DatabaseConnection {
  name: string;
  type: 'vector' | 'archive' | 'search' | 'graph' | 'local';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastHealthCheck: number;
  endpoint?: string;
  error?: string;
}

export interface QueryRequest {
  type: 'semantic' | 'keyword' | 'graph' | 'timeseries';
  query: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number;
  data: PalliumRecord;
  source: string;
}

class PalliumGatewayClass {
  private static instance: PalliumGatewayClass | null = null;
  private connections: Map<string, DatabaseConnection> = new Map();
  private cache: Map<string, PalliumRecord> = new Map();
  // ...rest of PalliumGatewayClass implementation...
}

export const PalliumGateway = PalliumGatewayClass;
