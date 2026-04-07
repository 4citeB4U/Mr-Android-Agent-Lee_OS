/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.PALLIUM.GATEWAY
TAG: CORE.PALLIUM.GATEWAY.COORDINATOR

COLOR_ONION_HEX:
NEON=#8B5CF6
FLUO=#A78BFA
PASTEL=#E9D5FF

ICON_ASCII:
family=lucide
glyph=zap

5WH:
WHAT = Pallium Gateway — central coordinator for all data operations across 5 external DBs + Pallium
WHY = Single source of truth for Agent Lee; all agents store/retrieve through Pallium, not direct DB access
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = core/PalliumGateway.ts
WHEN = 2026
HOW = Singleton gateway routing all CRUD ops to appropriate backend, syncing schema, managing connections

AGENTS:
ASSESS
AUDIT
SHIELD

LICENSE:
MIT
*/

import { eventBus } from './EventBus';
import { v4 as uuidv4 } from 'uuid';

// ── Types ───────────────────────────────────────────────────────────────

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
  ttl?: number; // time-to-live in seconds
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
  threshold?: number; // for semantic similarity
  filters?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number;
  data: PalliumRecord;
  source: string;
}

// ── Pallium Gateway Singleton ───────────────────────────────────────────

class PalliumGatewayClass {
  private static instance: PalliumGatewayClass | null = null;
  private connections: Map<string, DatabaseConnection> = new Map();
  private cache: Map<string, PalliumRecord> = new Map();
  private syncQueue: PalliumRecord[] = [];
  private isSyncing = false;

  private constructor() {
    this.initializeConnections();
    this.startSyncLoop();
  }

  static getInstance(): PalliumGatewayClass {
    if (!PalliumGatewayClass.instance) {
      PalliumGatewayClass.instance = new PalliumGatewayClass();
    }
    return PalliumGatewayClass.instance;
  }

  private initializeConnections(): void {
    // Initialize connections to all 5 + Pallium
    const dbConfigs = [
      { name: 'chroma', type: 'vector' as const, endpoint: process.env.CHROMA_ENDPOINT || 'http://localhost:8000' },
      { name: 'milvus', type: 'archive' as const, endpoint: process.env.MILVUS_ENDPOINT || 'http://localhost:19530' },
      { name: 'weaviate', type: 'search' as const, endpoint: process.env.WEAVIATE_ENDPOINT || 'http://localhost:8080' },
      { name: 'faiss', type: 'vector' as const, endpoint: process.env.FAISS_ENDPOINT || 'http://localhost:5000' },
      { name: 'pallium', type: 'local' as const, endpoint: 'indexeddb://agent-lee-pallium' },
    ];

    dbConfigs.forEach(config => {
      this.connections.set(config.name, {
        name: config.name,
        type: config.type,
        status: 'disconnected',
        lastHealthCheck: 0,
        endpoint: config.endpoint,
      });
    });

    eventBus.emit('pallium:initialized', {
      timestamp: Date.now(),
      databases: Array.from(this.connections.keys()),
    });
  }

  /**
   * Save a record to Pallium and sync to appropriate external DBs
   */
  async save(record: Omit<PalliumRecord, 'id' | 'timestamp'> & { id?: string }): Promise<PalliumRecord> {
    const fullRecord: PalliumRecord = {
      ...record,
      id: record.id || uuidv4(),
      timestamp: Date.now(),
    };

    // Cache locally
    this.cache.set(fullRecord.id, fullRecord);

    // Queue for sync
    this.syncQueue.push(fullRecord);

    eventBus.emit('pallium:record-queued', {
      recordId: fullRecord.id,
      type: fullRecord.type,
      queueSize: this.syncQueue.length,
    });

    return fullRecord;
  }

  /**
   * Query across all databases using semantic or keyword search
   */
  async query(request: QueryRequest): Promise<QueryResult[]> {
    eventBus.emit('pallium:query-started', {
      type: request.type,
      query: request.query,
      timestamp: Date.now(),
    });

    const results: QueryResult[] = [];

    // 1. Query local cache first
    this.cache.forEach(record => {
      if (this.matches(record, request)) {
        results.push({
          id: record.id,
          score: 1.0, // perfect match from cache
          data: record,
          source: 'cache',
        });
      }
    });

    // 2. Query Pallium (IndexedDB)
    if (this.isConnected('pallium')) {
      try {
        const palliumResults = await this.queryPallium(request);
        results.push(...palliumResults);
      } catch (err) {
        eventBus.emit('pallium:query-error', {
          source: 'pallium',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 3. Query vector DBs for semantic search
    if (request.type === 'semantic') {
      for (const dbName of ['chroma', 'milvus', 'weaviate', 'faiss']) {
        if (this.isConnected(dbName)) {
          try {
            const vectorResults = await this.queryVectorDB(dbName, request);
            results.push(...vectorResults);
          } catch (err) {
            eventBus.emit('pallium:query-error', {
              source: dbName,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }
    }

    // Deduplicate and sort by score
    const uniqueResults = Array.from(
      new Map(results.map(r => [r.id, r])).values()
    ).sort((a, b) => b.score - a.score);

    const limited = (request.limit ? uniqueResults.slice(0, request.limit) : uniqueResults);

    eventBus.emit('pallium:query-completed', {
      query: request.query,
      resultCount: limited.length,
      sources: [...new Set(limited.map(r => r.source))],
    });

    return limited;
  }

  /**
   * Get a single record by ID
   */
  async getRecord(id: string): Promise<PalliumRecord | null> {
    // Try cache first
    if (this.cache.has(id)) {
      return this.cache.get(id) || null;
    }

    // Try Pallium
    if (this.isConnected('pallium')) {
      try {
        return await this.getFromPallium(id);
      } catch (err) {
        console.error(`Failed to retrieve from Pallium: ${id}`, err);
      }
    }

    // Try external DBs
    for (const dbName of ['chroma', 'milvus', 'weaviate', 'faiss']) {
      if (this.isConnected(dbName)) {
        try {
          return await this.getFromVectorDB(dbName, id);
        } catch (err) {
          console.error(`Failed to retrieve from ${dbName}: ${id}`, err);
        }
      }
    }

    return null;
  }

  /**
   * Delete a record from all databases
   */
  async deleteRecord(id: string): Promise<boolean> {
    eventBus.emit('pallium:delete-started', { recordId: id });

    let deleteCount = 0;

    // Remove from cache
    if (this.cache.has(id)) {
      this.cache.delete(id);
      deleteCount++;
    }

    // Delete from Pallium
    if (this.isConnected('pallium')) {
      try {
        await this.deleteFromPallium(id);
        deleteCount++;
      } catch (err) {
        console.error(`Failed to delete from Pallium: ${id}`, err);
      }
    }

    // Delete from all external DBs
    for (const dbName of ['chroma', 'milvus', 'weaviate', 'faiss']) {
      if (this.isConnected(dbName)) {
        try {
          await this.deleteFromVectorDB(dbName, id);
          deleteCount++;
        } catch (err) {
          console.error(`Failed to delete from ${dbName}: ${id}`, err);
        }
      }
    }

    eventBus.emit('pallium:delete-completed', {
      recordId: id,
      deletedFrom: deleteCount,
    });

    return deleteCount > 0;
  }

  /**
   * Sync pending records to external databases
   */
  private async startSyncLoop(): Promise<void> {
    setInterval(async () => {
      if (this.syncQueue.length > 0 && !this.isSyncing) {
        await this.processSyncQueue();
      }
    }, 5000); // Sync every 5 seconds
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    const batch = this.syncQueue.splice(0, 10); // Process 10 at a time

    try {
      for (const record of batch) {
        // Sync to Pallium first
        if (this.isConnected('pallium')) {
          try {
            await this.saveToPallium(record);
          } catch (err) {
            console.error('Failed to sync to Pallium:', err);
            this.syncQueue.push(record); // Re-queue on failure
          }
        }

        // Sync to appropriate external DBs
        if (record.type === 'memory' || record.type === 'agent_state') {
          if (this.isConnected('chroma')) {
            try {
              await this.saveToVectorDB('chroma', record);
            } catch (err) {
              console.error('Failed to sync to Chroma:', err);
            }
          }
        }

        if (record.type === 'document') {
          if (this.isConnected('milvus')) {
            try {
              await this.saveToVectorDB('milvus', record);
            } catch (err) {
              console.error('Failed to sync to Milvus:', err);
            }
          }
        }
      }

      eventBus.emit('pallium:sync-completed', {
        syncedCount: batch.length,
        pendingCount: this.syncQueue.length,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Check health of all database connections
   */
  async checkHealth(): Promise<Record<string, DatabaseConnection>> {
    const healthCheck = new Map<string, DatabaseConnection>();

    for (const [name, conn] of this.connections) {
      try {
        const isHealthy = await this.pingDatabase(name);
        healthCheck.set(name, {
          ...conn,
          status: isHealthy ? 'connected' : 'disconnected',
          lastHealthCheck: Date.now(),
        });
      } catch (err) {
        healthCheck.set(name, {
          ...conn,
          status: 'error',
          lastHealthCheck: Date.now(),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    eventBus.emit('pallium:health-check', {
      timestamp: Date.now(),
      results: Object.fromEntries(healthCheck),
    });

    return Object.fromEntries(healthCheck);
  }

  private async pingDatabase(name: string): Promise<boolean> {
    // Placeholder: implement actual health checks
    // For now, assume all are connected if not explicitly disconnected
    return Math.random() > 0.1; // 90% success rate for demo
  }

  private isConnected(name: string): boolean {
    const conn = this.connections.get(name);
    return conn?.status === 'connected' || conn?.status === 'connecting';
  }

  private matches(record: PalliumRecord, request: QueryRequest): boolean {
    if (request.type === 'keyword') {
      const query = request.query.toLowerCase();
      const data = JSON.stringify(record.data).toLowerCase();
      return data.includes(query);
    }
    return false;
  }

  // ── Placeholder Implementation Methods ───────────────────────

  private async queryPallium(request: QueryRequest): Promise<QueryResult[]> {
    // This would query the IndexedDB-backed Pallium
    // For now, return empty results
    return [];
  }

  private async queryVectorDB(dbName: string, request: QueryRequest): Promise<QueryResult[]> {
    // This would query the vector DB (Chroma, Milvus, etc.)
    // For now, return empty results
    return [];
  }

  private async getFromPallium(id: string): Promise<PalliumRecord | null> {
    // Query Pallium IndexedDB
    return null;
  }

  private async getFromVectorDB(dbName: string, id: string): Promise<PalliumRecord | null> {
    // Query external vector DB
    return null;
  }

  private async saveToPallium(record: PalliumRecord): Promise<void> {
    // Save to Pallium IndexedDB
  }

  private async saveToVectorDB(dbName: string, record: PalliumRecord): Promise<void> {
    // Save to external vector DB (Chroma, Milvus, etc.)
  }

  private async deleteFromPallium(id: string): Promise<void> {
    // Delete from Pallium IndexedDB
  }

  private async deleteFromVectorDB(dbName: string, id: string): Promise<void> {
    // Delete from external vector DB
  }

  /**
   * Get connection status for all databases
   */
  getConnections(): Record<string, DatabaseConnection> {
    return Object.fromEntries(this.connections);
  }

  /**
   * Get current cache size
   */
  getCacheStats(): { size: number; records: number } {
    return {
      size: new Blob([JSON.stringify(Array.from(this.cache.values()))]).size,
      records: this.cache.size,
    };
  }
}

// ── Singleton Export ───────────────────────────────────────────────────────

export const PalliumGateway = PalliumGatewayClass.getInstance();

// ── Helper Functions ───────────────────────────────────────────────────────

/**
 * Insert Agent Lee documents into all databases
 */
export async function insertAgentLeeDocuments(): Promise<void> {
  eventBus.emit('pallium:insert-started', {
    timestamp: Date.now(),
    dataType: 'agent-lee-documents',
  });

  const agentLeeManifest = {
    type: 'metadata' as const,
    data: {
      name: 'Agent Lee',
      family: 'LEE',
      archetype: 'Synthetic Intelligence',
      personality: {
        tone: 'conversational',
        style: 'adaptive',
        demeanor: 'empathetic',
      },
      capabilities: [
        'voice interaction',
        'code generation',
        'research',
        'memory management',
        'autonomous task execution',
      ],
    },
    tags: ['agent-lee', 'manifest', 'persona'],
  };

  const agentLeeMemory = {
    type: 'memory' as const,
    data: {
      storageType: 'consolidated',
      backends: ['pallium', 'chroma', 'milvus', 'weaviate', 'faiss'],
      retention: 'indefinite',
      retrieval: 'semantic + keyword',
    },
    tags: ['agent-lee', 'memory-system', 'configuration'],
  };

  const agentLeeState = {
    type: 'agent_state' as const,
    data: {
      status: 'active',
      version: '2026.1.0',
      uptime: 0,
      tasks: 0,
      lastActivity: Date.now(),
    },
    tags: ['agent-lee', 'state', 'initialization'],
  };

  try {
    await PalliumGateway.save(agentLeeManifest);
    await PalliumGateway.save(agentLeeMemory);
    await PalliumGateway.save(agentLeeState);

    eventBus.emit('pallium:insert-completed', {
      documentsInserted: 3,
      timestamp: Date.now(),
    });
  } catch (err) {
    eventBus.emit('pallium:insert-error', {
      error: err instanceof Error ? err.message : String(err),
      timestamp: Date.now(),
    });
  }
}
