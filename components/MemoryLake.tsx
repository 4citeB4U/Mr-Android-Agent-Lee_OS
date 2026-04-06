/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.MEMORY
TAG: UI.COMPONENT.MEMORY.LAKE

COLOR_ONION_HEX:
NEON=#7B00FF
FLUO=#9C27B0
PASTEL=#E1BEE7

ICON_ASCII:
family=lucide
glyph=archive

5WH:
WHAT = Memory Lake — full-featured UI for storing, browsing, and exporting Agent Lee's memory
WHY = Gives users complete visibility and control over Agent Lee's persistent memory state
WHO = Agent Lee OS
WHERE = components/MemoryLake.tsx
WHEN = 2026
HOW = React component with IndexedDB CRUD, JSZip export, and search/filter capabilities

AGENTS:
ASSESS
ALIGN
AUDIT
ECHO

LICENSE:
PROPRIETARY
*/
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Text, 
  Stars,
  Environment,
  Float,
  ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';
import { 
  X, Folder, FileText, Database, Code, Video, Archive, Mic, 
  Upload, Download, RefreshCw, Cpu, MessageSquare, Search, 
  FileCode, FileJson, FileType, Layers, Terminal as TerminalIcon,
  Zap, Shield, Globe, HardDrive, Settings, Activity, ShieldAlert, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types & Constants ---

export type DriveId = "L" | "E" | "O" | "N" | "A" | "R" | "D" | "LEE";
export type CorruptionStatus = "safe" | "suspect" | "corrupt" | "offloaded"; 
export type FileCategory = "code" | "data" | "doc" | "media" | "sys" | "archive" | "pdf" | "audio";

export const DRIVE_COLORS: Record<DriveId, string> = {
    "LEE": "#ffffff", "N": "#d8b4fe", "A": "#f472b6", "R": "#fb923c",
    "O": "#fbbf24", "L": "#22d3ee", "E": "#facc15", "D": "#4ade80",
};

export interface NeuralFile {
  id: string;
  driveId: DriveId;
  slotId: number;
  cellId: number;
  name: string;
  path: string; 
  extension: string;
  sizeBytes: number;
  content: string | Blob | null; 
  category: FileCategory;
  status: CorruptionStatus;
  lastModified: number;
  signature: string; 
  annotations: { id: string; text: string; timestamp: string }[];
  links?: { driveId: DriveId; slotId: number; cellId: number }[];
  // Tracking & Monitoring
  origin: 'user' | 'agent' | 'system';
  createdBy?: string;
  lastHandledBy?: string;
  healthStatus: 'healthy' | 'corrupt';
  securityStatus: 'secure' | 'quarantined' | 'inspected';
  deletionDate?: number;
  history: { action: string; actor: string; timestamp: number }[];
  purpose?: string;
  locked?: boolean;
}

interface NeuralDB extends DBSchema {
  files: {
    key: string;
    value: NeuralFile;
    indexes: { 'by-slot': [string, number]; 'by-cell': [string, number, number]; 'by-signature': string };
  };
  meta: { key: string; value: { initialized: boolean } };
}

const DB_NAME_CORE = 'agent-lee-neural-core';
const DB_VERSION_CORE = 3;

const CATEGORY_ICONS: Record<string, any> = {
  code: Code,
  media: Video,
  doc: FileText,
  archive: Archive,
  sys: Database,
  data: Folder,
  pdf: FileText,
  audio: Mic
};

// --- Utility: cn ---
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

// --- Neural Database Service ---

class NeuralLink {
  private dbPromise: Promise<IDBPDatabase<NeuralDB>>;

  constructor() {
    this.dbPromise = openDB<NeuralDB>(DB_NAME_CORE, DB_VERSION_CORE, {
      upgrade(db, oldVersion) {
        if (oldVersion < 3) {
             if (db.objectStoreNames.contains('files')) db.deleteObjectStore('files');
             if (db.objectStoreNames.contains('meta')) db.deleteObjectStore('meta');
        }
        if (!db.objectStoreNames.contains('files')) {
            const fileStore = db.createObjectStore('files', { keyPath: 'id' });
            fileStore.createIndex('by-slot', ['driveId', 'slotId']);
            fileStore.createIndex('by-cell', ['driveId', 'slotId', 'cellId']);
            fileStore.createIndex('by-signature', 'signature');
        }
        if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta');
        }
      },
    });
    this.initializeCore();
  }

  private async initializeCore() {
    const db = await this.dbPromise;
    const meta = await db.get('meta', 'init');
    if (!meta) {
      await this.seedMockData();
      await db.put('meta', { initialized: true }, 'init');
    }
  }

  async getFiles(driveId: DriveId, slotId: number, cellId: number): Promise<NeuralFile[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('files', 'by-cell', [driveId, slotId, cellId]);
  }

  async getFilesBySlot(driveId: DriveId, slotId: number): Promise<NeuralFile[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('files', 'by-slot', [driveId, slotId]);
  }

  async getAllFiles(): Promise<NeuralFile[]> {
    const db = await this.dbPromise;
    return db.getAll('files');
  }

  async addFile(file: NeuralFile) {
    const db = await this.dbPromise;
    await db.put('files', file);
  }

  async deleteFile(id: string) {
    const db = await this.dbPromise;
    await db.delete('files', id);
  }

  private async seedMockData() {
    const drives: DriveId[] = ["L", "E", "O", "N", "A", "R", "D", "LEE"];
    const roles: Record<string, FileCategory[]> = {
        "LEE": ["sys", "code"],
        "N": ["media"], "A": ["media"],
        "R": ["media", "doc", "pdf"], "O": ["archive", "data"],
        "L": ["code", "data"], "E": ["data", "code", "audio"],
        "D": ["doc", "pdf"]
    };

    const db = await this.dbPromise;
    const tx = db.transaction('files', 'readwrite');

    for (const d of drives) {
        for (let s = 1; s <= 8; s++) {
            for (let c = 1; c <= 8; c++) {
                if (Math.random() > 0.7) {
                    const count = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < count; i++) {
                        const cat = roles[d][i % roles[d].length] || 'doc';
                        const isCorrupt = Math.random() > 0.95;
                        let extension = 'dat';
                        if (cat === 'code') extension = 'ts';
                        if (cat === 'media') extension = 'png';
                        if (cat === 'pdf') extension = 'pdf';
                        if (cat === 'audio') extension = 'mp3';
                        if (cat === 'data') extension = 'json';
                        
                        const file: NeuralFile = {
                            id: `${d}-${s}-${c}-${i}-${Date.now()}-${Math.random()}`,
                            driveId: d, slotId: s, cellId: c,
                            name: `mem_frag_${d}${s}${c}_${i}.${extension}`,
                            path: "", extension: extension,
                            sizeBytes: Math.floor(Math.random() * 10000),
                            content: "Neural data fragment content placeholder...",
                            category: cat,
                            status: isCorrupt ? 'corrupt' : 'safe',
                            lastModified: Date.now(),
                            signature: `SIG_${d}_${i}`,
                            annotations: [],
                            links: Math.random() > 0.8 ? [
                              { 
                                driveId: drives[Math.floor(Math.random() * drives.length)],
                                slotId: Math.floor(Math.random() * 8) + 1,
                                cellId: Math.floor(Math.random() * 8) + 1
                              }
                            ] : [],
                            origin: 'system',
                            createdBy: 'System Core',
                            lastHandledBy: 'System Core',
                            healthStatus: isCorrupt ? 'corrupt' : 'healthy',
                            securityStatus: 'secure',
                            history: [{ action: 'Created', actor: 'System Core', timestamp: Date.now() }],
                            purpose: 'Neural memory fragment',
                            locked: isCorrupt,
                            deletionDate: isCorrupt ? Date.now() + (15 * 24 * 60 * 60 * 1000) : undefined
                        };
                        tx.store.put(file);
                    }
                }
            }
        }
    }
    await tx.done;
  }
}

const neuralDB = new NeuralLink();

// --- 3D Components ---

const CoreCube = ({ activeDrive, onCellClick, allFiles }: { activeDrive: DriveId, onCellClick: (slot: number, cell: number) => void, allFiles: NeuralFile[] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const driveColor = DRIVE_COLORS[activeDrive];
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05;
    }
  });

  const cubes = useMemo(() => {
    const temp = [];
    const size = 4; 
    const spacing = 0.5;
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const index = x + y * 4 + z * 16;
          const slotId = Math.floor(index / 8) + 1;
          const cellId = (index % 8) + 1;
          temp.push({
            pos: [(x - 1.5) * spacing, (y - 1.5) * spacing, (z - 1.5) * spacing],
            slotId,
            cellId
          });
        }
      }
    }
    return temp;
  }, []);

  const cellOccupancy = useMemo(() => {
    const map = new Map<string, number>();
    allFiles.filter(f => f.driveId === activeDrive).forEach(f => {
      const key = `${f.slotId}-${f.cellId}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [allFiles, activeDrive]);

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => {
        const hasFiles = cellOccupancy.has(`${cube.slotId}-${cube.cellId}`);
        const fileCount = cellOccupancy.get(`${cube.slotId}-${cube.cellId}`) || 0;
        
        return (
          <mesh 
            key={i} 
            position={cube.pos as [number, number, number]}
            onClick={(e) => {
              e.stopPropagation();
              onCellClick(cube.slotId, cube.cellId);
            }}
          >
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial 
              color={hasFiles ? driveColor : "#777"} 
              emissive={hasFiles ? driveColor : "#333"} 
              emissiveIntensity={hasFiles ? 2.0 + Math.min(fileCount * 0.5, 5) : 0.5} 
              transparent
              opacity={0.95}
            />
            <mesh>
              <boxGeometry args={[0.36, 0.36, 0.36]} />
              <meshBasicMaterial color={driveColor} wireframe transparent opacity={hasFiles ? 0.3 : 0.05} />
            </mesh>
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 15, 32]} />
        <meshBasicMaterial color={driveColor} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

const SolidBeam = ({ start, end, color, active }: { start: [number, number, number], end: [number, number, number], color: string, active: boolean }) => {
  const { midPoint, distance, quaternion } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
    const dist = s.distanceTo(e);
    const dir = new THREE.Vector3().subVectors(e, s).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { midPoint: mid, distance: dist, quaternion: quat };
  }, [start, end]);

  return (
    <mesh position={midPoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.05, 0.05, distance, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={active ? 0.8 : 0.2} 
      />
    </mesh>
  );
};

// --- 3D Modules for Terminals ---

const LogicModule = ({ color, active }: { color: string, active: boolean }) => (
  <group>
    <mesh position={[0, -0.2, 0]}>
      <boxGeometry args={[0.5, 0.05, 0.5]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    {[...Array(4)].map((_, i) => (
      <mesh key={i} position={[0, -0.15, 0]} rotation={[0, (i * Math.PI) / 2, 0]}>
        <boxGeometry args={[0.01, 0.01, 0.4]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.5} />
      </mesh>
    ))}
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={1} />
    </mesh>
  </group>
);

const EngineModule = ({ color, active }: { color: string, active: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 2;
  });
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <group ref={ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.02, 8, 24]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.5} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
};

const ObjectModule = ({ color, active }: { color: string, active: boolean }) => (
  <group>
    <mesh>
      <octahedronGeometry args={[0.3]} />
      <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={1} />
    </mesh>
    {[...Array(4)].map((_, i) => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.4, 0, Math.sin(i * Math.PI / 2) * 0.4]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.5} />
      </mesh>
    ))}
  </group>
);

const MediaModule = ({ color, active }: { color: string, active: boolean }) => (
  <group>
    <mesh position={[0, 0, -0.05]}>
      <planeGeometry args={[0.6, 0.4]} />
      <meshStandardMaterial color="#000" />
    </mesh>
    {[...Array(8)].map((_, i) => (
      <mesh key={i} position={[(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, 0]}>
        <planeGeometry args={[0.05, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.4} />
      </mesh>
    ))}
  </group>
);

const AudioModule = ({ color, active }: { color: string, active: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current && active) {
      ref.current.children.forEach((child: any, i) => {
        child.scale.y = 1 + Math.sin(state.clock.getElapsedTime() * 6 + i * 0.8) * 0.5;
      });
    }
  });
  return (
    <group ref={ref}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[(i - 2) * 0.1, 0, 0]}>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.5} />
        </mesh>
      ))}
    </group>
  );
};

const ResearchModule = ({ color, active }: { color: string, active: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 1;
  });
  return (
    <group ref={ref}>
      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 1.0) * 0.2, i * 0.1 - 0.25, Math.sin(i * 1.0) * 0.2]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.5} />
        </mesh>
      ))}
    </group>
  );
};

const DataModule = ({ color, active }: { color: string, active: boolean }) => (
  <group>
    {[...Array(2)].map((_, i) => (
      <group key={i} position={[0, (i - 0.5) * 0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 0.15, 0.4]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>
    ))}
  </group>
);

const CoreModule = ({ color, active }: { color: string, active: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
};

const Terminal = ({ position, color, label, subLabel, active, onClick, securityNodePos }: { position: [number, number, number], color: string, label: string, subLabel: string, active: boolean, onClick: () => void, securityNodePos: [number, number, number] }) => {
  const renderModule = () => {
    switch (label) {
      case "L": return <LogicModule color={color} active={active} />;
      case "E": return <EngineModule color={color} active={active} />;
      case "O": return <ObjectModule color={color} active={active} />;
      case "N": return <MediaModule color={color} active={active} />;
      case "A": return <AudioModule color={color} active={active} />;
      case "R": return <ResearchModule color={color} active={active} />;
      case "D": return <DataModule color={color} active={active} />;
      case "LEE": return <CoreModule color={color} active={active} />;
      default: return null;
    }
  };

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Base Pedestal */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[1.4, 0.1, 1.2]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Main Terminal Housing */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 1.4, 1]} />
        <meshStandardMaterial 
          color={active ? "#aaa" : "#666"} 
          emissive={active ? color : "#222"} 
          emissiveIntensity={active ? 0.8 : 0.2}
          metalness={0.4} 
          roughness={0.6} 
        />
      </mesh>

      {/* Internal Module Display Area */}
      <group position={[0, 0.1, 0]}>
        {renderModule()}
      </group>

      {/* Screen Interface */}
      <mesh position={[0, 0.1, 0.51]}>
        <planeGeometry args={[0.9, 0.7]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={active ? 0.7 : 0.3} 
        />
        <Text 
          position={[0, -0.25, 0.01]} 
          fontSize={0.07} 
          color="white" 
          maxWidth={0.8}
        >
          {subLabel} SYSTEM
        </Text>
      </mesh>

      {/* Top Identification Plate */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color={color} />
        <Text position={[0, 0, 0.06]} fontSize={0.12} color="white" fontWeight="900">
          {label}
        </Text>
      </mesh>

      {/* Connection Beam to Security Node */}
      <SolidBeam 
        start={[0, 0, 0]} 
        end={[securityNodePos[0] - position[0], securityNodePos[1] - position[1], securityNodePos[2] - position[2]]} 
        color={color} 
        active={active} 
      />

      {/* Ground Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1], 0]}>
        <ringGeometry args={[1.5, 1.6, 64]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 1 : 0.1} />
      </mesh>
    </group>
  );
};

const SecurityNode = ({ position, corruptFiles, onClick }: { position: [number, number, number], corruptFiles: NeuralFile[], onClick: () => void }) => {
  const cubePositions: [number, number, number][] = [
    [0.25, 0.25, 0],
    [-0.25, 0.25, 0],
    [0.25, -0.25, 0],
    [-0.25, -0.25, 0]
  ];

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {cubePositions.map((pos, idx) => {
        // Only use up to 2 cubes for quarantine containers
        const isQuarantine = (idx === 0 && corruptFiles.length > 0) || (idx === 1 && corruptFiles.length > 10);
        
        return (
          <group key={idx} position={pos}>
            {/* Hollow Wireframe (Blue) */}
            <mesh>
              <boxGeometry args={[0.45, 0.45, 0.45]} />
              <meshBasicMaterial color="#0088ff" wireframe transparent opacity={0.3} />
            </mesh>
            
            {/* Solid Color if contains files */}
            {isQuarantine && (
              <mesh>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial 
                  color="#ff0000" 
                  emissive="#ff0000" 
                  emissiveIntensity={2}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}
          </group>
        );
      })}
      
      {/* Central Glow */}
      <pointLight color={corruptFiles.length > 0 ? "#ff0000" : "#0088ff"} intensity={1} distance={2} />

      {/* Connection to Core */}
      <SolidBeam start={[0, 0, 0]} end={[-position[0], -position[1], -position[2]]} color="#0088ff" active={true} />
    </group>
  );
};

const DataPacket = ({ start, end, color, onComplete, speed = 1500 }: { start: THREE.Vector3, end: THREE.Vector3, color: string, onComplete: () => void, speed?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useMemo(() => Date.now(), []);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / speed, 1);
    
    const pos = new THREE.Vector3().lerpVectors(start, end, progress);
    meshRef.current.position.copy(pos);
    
    // Pulse scale
    const s = 1 + Math.sin(progress * Math.PI) * 0.5;
    meshRef.current.scale.setScalar(s * 0.1);
    
    if (progress >= 1) onComplete();
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

const SecurityAgent = ({ start, end, onComplete }: { start: THREE.Vector3, end: THREE.Vector3, onComplete: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useMemo(() => Date.now(), []);
  const duration = 3000;

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const pos = new THREE.Vector3().lerpVectors(start, end, progress);
    // Spiraling motion
    const angle = progress * Math.PI * 4;
    const radius = Math.sin(progress * Math.PI) * 2;
    pos.x += Math.cos(angle) * radius;
    pos.z += Math.sin(angle) * radius;
    
    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y += 0.1;
    
    if (progress >= 1) onComplete();
  });

  return (
    <group ref={meshRef as any}>
        <mesh>
            <octahedronGeometry args={[0.15]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} transparent opacity={0.8} />
        </mesh>
        <pointLight color="#00ffff" intensity={0.5} distance={2} />
    </group>
  );
};

const DataFlowManager = ({ terminals, activeDrive, activeFileLinks, securityNodes }: { terminals: any[], activeDrive: DriveId, activeFileLinks: { driveId: DriveId }[], securityNodes: any[] }) => {
  const [packets, setPackets] = useState<{ id: number, start: THREE.Vector3, end: THREE.Vector3, color: string, type: 'standard' | 'agent' }[]>([]);
  const nextId = useRef(0);
  
  const getSecurityNodeForDrive = (driveLabel: string) => {
    return securityNodes.find(n => n.drives.includes(driveLabel))?.pos || [0,0,0];
  };

  // Effect for linked drive transfers when activeDrive changes
  useEffect(() => {
    if (!activeDrive) return;

    const startTerminal = terminals.find(t => t.label === activeDrive);
    if (!startTerminal) return;

    const startPos = new THREE.Vector3(...startTerminal.pos);
    const corePos = new THREE.Vector3(0, 0, 0);
    const securityNodePos = new THREE.Vector3(...getSecurityNodeForDrive(activeDrive));

    // 1. Burst from active drive to security node
    const burstCount = 5;
    for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
            setPackets(prev => [
                ...prev,
                {
                    id: nextId.current++,
                    start: startPos,
                    end: securityNodePos,
                    color: startTerminal.color,
                    type: 'standard'
                }
            ]);
            
            // 2. After a delay, send from security node to core
            setTimeout(() => {
                setPackets(prev => [
                    ...prev,
                    {
                        id: nextId.current++,
                        start: securityNodePos,
                        end: corePos,
                        color: startTerminal.color,
                        type: 'standard'
                    }
                ]);
            }, 800);
        }, i * 300);
    }

    // 3. If there are links, show transfers to connected drives
    if (activeFileLinks.length > 0) {
        activeFileLinks.forEach((link, idx) => {
            const targetTerminal = terminals.find(t => t.label === link.driveId);
            if (targetTerminal) {
                const targetPos = new THREE.Vector3(...targetTerminal.pos);
                setTimeout(() => {
                    setPackets(prev => [
                        ...prev,
                        {
                            id: nextId.current++,
                            start: corePos,
                            end: targetPos,
                            color: targetTerminal.color,
                            type: 'standard'
                        }
                    ]);
                }, 2000 + idx * 300);
            }
        });
    }
  }, [activeDrive, activeFileLinks, terminals, securityNodes]);

  useFrame((state, delta) => {
    // Balanced frequency for Pi compatibility
    if (Math.floor(state.clock.elapsedTime * 1.0) > Math.floor((state.clock.elapsedTime - delta) * 1.0)) {
      const type = Math.random();
      
      if (type < 0.8) {
        const terminal = terminals[Math.floor(Math.random() * terminals.length)];
        const securityNodePos = new THREE.Vector3(...getSecurityNodeForDrive(terminal.label));
        const terminalPos = new THREE.Vector3(...terminal.pos);

        setPackets(prev => [
          ...prev.slice(-40), // Keep queue manageable
          {
            id: nextId.current++,
            start: terminalPos,
            end: securityNodePos,
            color: terminal.color,
            type: 'standard'
          }
        ]);
      }
    }
  });

  const removePacket = (id: number) => setPackets(prev => prev.filter(p => p.id !== id));

  return (
    <group>
      {packets.map(p => (
        p.type === 'agent' ? (
            <SecurityAgent key={p.id} start={p.start} end={p.end} onComplete={() => removePacket(p.id)} />
        ) : (
            <DataPacket key={p.id} start={p.start} end={p.end} color={p.color} onComplete={() => removePacket(p.id)} />
        )
      ))}
    </group>
  );
};

// --- Agent & Conversion Logic ---

const Pallium = () => {
  const [activeDrive, setActiveDrive] = useState<DriveId>("LEE");
  const [activeDatabase, setActiveDatabase] = useState<string>("Neural Core");
  const [explorerConfig, setExplorerConfig] = useState<{ driveId?: DriveId, driveIds?: DriveId[], slotId?: number, cellId?: number } | null>(null);
  const [allFiles, setAllFiles] = useState<NeuralFile[]>([]);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<NeuralFile | null>(null);
  const [botActivity, setBotActivity] = useState<{ id: number, driveId: DriveId, fileName: string } | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" }), []);

  const refreshFiles = useCallback(async () => {
    const fs = await neuralDB.getAllFiles();
    setAllFiles(fs);
  }, []);

  useEffect(() => {
    refreshFiles();
    const interval = setInterval(refreshFiles, 5000);
    return () => clearInterval(interval);
  }, [refreshFiles]);

  // Security Bot Autonomous Logic
  useEffect(() => {
    const runBot = async () => {
      const drives: DriveId[] = ["L", "E", "O", "N", "A", "R", "D", "LEE"];
      const randomDrive = drives[Math.floor(Math.random() * drives.length)];
      const files = await neuralDB.getAllFiles();
      const driveFiles = files.filter(f => f.driveId === randomDrive);
      
      if (driveFiles.length > 0) {
        const randomFile = driveFiles[Math.floor(Math.random() * driveFiles.length)];
        setBotActivity({ id: Date.now(), driveId: randomDrive, fileName: randomFile.name });
        
        if (randomFile.healthStatus !== 'corrupt' && Math.random() > 0.95) {
          const updatedFile: NeuralFile = {
            ...randomFile,
            healthStatus: 'corrupt',
            locked: true,
            deletionDate: Date.now() + (15 * 24 * 60 * 60 * 1000),
            history: [...(randomFile.history || []), { action: 'Corruption Detected', actor: 'Security Bot', timestamp: Date.now() }]
          };
          await neuralDB.addFile(updatedFile);
          refreshFiles();
        } else {
          const updatedFile: NeuralFile = {
            ...randomFile,
            securityStatus: 'inspected',
            history: [...(randomFile.history || []), { action: 'Security Inspection', actor: 'Security Bot', timestamp: Date.now() }]
          };
          await neuralDB.addFile(updatedFile);
        }
      }
      setTimeout(() => setBotActivity(null), 3000);
    };

    const botInterval = setInterval(runBot, 15000);
    return () => clearInterval(botInterval);
  }, [refreshFiles]);

  // --- File Conversion Logic ---

  const convertHtmlToText = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const createWordDoc = async (filename: string, content: string) => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${content}</w:t></w:r></w:p></w:body></w:document>`);
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConversionStatus(`Uploading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const extension = file.name.split('.').pop() || 'dat';
      
      const neuralFile: NeuralFile = {
        id: `UPLOAD-${Date.now()}`,
        driveId: activeDrive,
        slotId: 1,
        cellId: 1,
        name: file.name,
        path: "",
        extension,
        sizeBytes: file.size,
        content: content,
        category: (['ts', 'js', 'html', 'css'].includes(extension) ? 'code' : 
                   ['png', 'jpg', 'mp4'].includes(extension) ? 'media' : 
                   ['pdf'].includes(extension) ? 'pdf' : 'doc') as FileCategory,
        status: 'safe',
        lastModified: Date.now(),
        signature: `SIG_UPLOAD_${Date.now()}`,
        annotations: [],
        origin: 'user',
        createdBy: 'User_Alex',
        lastHandledBy: 'User_Alex',
        healthStatus: 'healthy',
        securityStatus: 'secure',
        history: [{ action: 'Uploaded', actor: 'User_Alex', timestamp: Date.now() }],
        purpose: 'User uploaded content',
        locked: false
      };

      await neuralDB.addFile(neuralFile);
      setConversionStatus(`File ${file.name} added to ${activeDatabase} // Drive ${activeDrive}`);
      refreshFiles();
      setTimeout(() => setConversionStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleAgentAction = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsProcessing(true);

    try {
      // RAG: Provide context of current files
      const fileContext = allFiles.map(f => `${f.name} (${f.category})`).join(', ');
      const prompt = `You are Agent Lee, a neural database administrator. 
      Current Database: ${activeDatabase}.
      Current files in database: ${fileContext}.
      User request: ${msg}.
      If the user wants to convert a file, explain how you will do it. 
      If they want to search, find relevant files.
      If they want to edit, explain your plan.
      Be concise and professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const reply = response.text || "I'm processing your request.";
      setChatMessages(prev => [...prev, { role: 'agent', content: reply }]);

      // Simulated RAG Search
      if (msg.toLowerCase().includes("search") || msg.toLowerCase().includes("find")) {
        const searchTerms = msg.toLowerCase().split(' ').filter(word => word.length > 3);
        const results = allFiles.filter(f => searchTerms.some(term => f.name.toLowerCase().includes(term)));
        if (results.length > 0) {
          setChatMessages(prev => [...prev, { role: 'agent', content: `Search Results: Found ${results.length} relevant neural fragments: ${results.map(r => r.name).join(', ')}` }]);
          
          // Track interaction
          for (const f of results) {
            const updatedFile: NeuralFile = {
              ...f,
              lastHandledBy: 'Agent Lee',
              history: [...(f.history || []), { action: 'Accessed by Agent', actor: 'Agent Lee', timestamp: Date.now() }]
            };
            await neuralDB.addFile(updatedFile);
          }
          refreshFiles();
        }
      }

      // Simulated Conversion
      if (msg.toLowerCase().includes("convert") && msg.toLowerCase().includes("word")) {
        setConversionStatus("Agent Lee: Initiating conversion sequence...");
        setTimeout(() => createWordDoc("converted_document", "Extracted content from neural fragment..."), 2000);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', content: "Error connecting to neural core: " + (err as Error).message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async (file: NeuralFile, newContent: string) => {
    const updatedFile: NeuralFile = { 
      ...file, 
      content: newContent, 
      lastModified: Date.now(),
      lastHandledBy: 'User_Alex',
      history: [...(file.history || []), { action: 'Edited', actor: 'User_Alex', timestamp: Date.now() }]
    };
    await neuralDB.addFile(updatedFile);
    setEditingFile(null);
    refreshFiles();
    setConversionStatus(`File ${file.name} updated successfully.`);
    setTimeout(() => setConversionStatus(null), 3000);
  };

  const handleTransferFile = async (file: NeuralFile, targetDrives: DriveId[], mode: 'copy' | 'move') => {
    if (file.locked) {
      setConversionStatus(`Transfer blocked: ${file.name} is locked/corrupt.`);
      setTimeout(() => setConversionStatus(null), 3000);
      return;
    }
    setConversionStatus(`${mode === 'copy' ? 'Copying' : 'Moving'} ${file.name}...`);
    
    try {
      for (const targetDrive of targetDrives) {
        if (targetDrive === file.driveId && mode === 'move') continue;
        
        const newFile: NeuralFile = {
          ...file,
          id: mode === 'copy' ? `${targetDrive}-${Date.now()}-${Math.random()}` : file.id,
          driveId: targetDrive,
          lastModified: Date.now(),
          history: [...(file.history || []), { action: `${mode === 'copy' ? 'Copied' : 'Moved'} to ${targetDrive}`, actor: 'User_Alex', timestamp: Date.now() }],
          // Ensure it doesn't collide if copying within same drive (though UI usually prevents this)
          name: mode === 'copy' && targetDrive === file.driveId ? `copy_of_${file.name}` : file.name
        };
        
        await neuralDB.addFile(newFile);
      }

      if (mode === 'move' && !targetDrives.includes(file.driveId)) {
        await neuralDB.deleteFile(file.id);
      }

      setConversionStatus(`File ${file.name} ${mode === 'copy' ? 'copied' : 'moved'} successfully.`);
      refreshFiles();
    } catch (err) {
      setConversionStatus(`Transfer failed: ${(err as Error).message}`);
    } finally {
      setTimeout(() => setConversionStatus(null), 3000);
    }
  };

  // --- Render Helpers ---

  const terminals = [
    { pos: [-6, 0, -2], color: DRIVE_COLORS["L"], label: "L", subLabel: "LOGIC" },
    { pos: [-2, 0, -6], color: DRIVE_COLORS["E"], label: "E", subLabel: "ENGINE" },
    { pos: [3, 0, -6], color: DRIVE_COLORS["O"], label: "O", subLabel: "OBJECT" },
    { pos: [6, 0, -2], color: DRIVE_COLORS["N"], label: "N", subLabel: "MEDIA" },
    { pos: [6, 0, 3], color: DRIVE_COLORS["A"], label: "A", subLabel: "AUDIO" },
    { pos: [2, 0, 6], color: DRIVE_COLORS["R"], label: "R", subLabel: "RESEARCH" },
    { pos: [-3, 0, 6], color: DRIVE_COLORS["D"], label: "D", subLabel: "DATA" },
    { pos: [-6, 0, 3], color: DRIVE_COLORS["LEE"], label: "LEE", subLabel: "CORE" },
  ];

  return (
    <div className="w-full h-screen bg-[#020204] overflow-hidden font-sans text-slate-200">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 1.5]}>
          <PerspectiveCamera makeDefault position={[0, 8, 15]} fov={50} />
          <Scene 
            activeDrive={activeDrive} 
            setActiveDrive={(d: DriveId) => {
              if (activeDrive === d) setExplorerConfig({ driveId: d });
              else setActiveDrive(d);
            }} 
            onCellClick={(slot: number, cell: number, drives?: DriveId[]) => setExplorerConfig(drives ? { driveIds: drives } : { driveId: activeDrive, slotId: slot, cellId: cell })}
            allFiles={allFiles}
            terminals={terminals}
          />
        </Canvas>
      </div>

      {/* Header UI */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-4 text-white">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 pointer-events-auto cursor-pointer" onClick={() => setIsCommandCenterOpen(!isCommandCenterOpen)}>
              <Menu className={cn("w-6 h-6 transition-colors", isCommandCenterOpen ? "text-cyan-400" : "text-white")} />
            </div>
            AGENT LEE
          </h1>
          <p className="text-[8px] font-mono opacity-40 tracking-[0.4em] uppercase mt-1 ml-1">Neural Interface v4.0</p>
        </motion.div>
      </div>

      {/* Bot Activity Status (Top Right) */}
      <div className="absolute top-8 right-8 z-10">
        <AnimatePresence>
          {botActivity && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl backdrop-blur-xl"
            >
              <Shield className="text-cyan-400 w-4 h-4 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-cyan-500 uppercase tracking-widest font-black">Security Bot Active</span>
                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{botActivity.fileName}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unified Side Panel */}
      <AnimatePresence>
        {isCommandCenterOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0c10]/95 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">Neural Core</h2>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">System Control Panel</p>
              </div>
              <button onClick={() => setIsCommandCenterOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {/* Drive Selector (Moved from bottom) */}
              <section>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4">Neural Sectors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(DRIVE_COLORS) as DriveId[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setActiveDrive(d)}
                      className={cn(
                        "h-12 rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                        activeDrive === d 
                          ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                          : "bg-black/40 border-white/5 opacity-40 hover:opacity-100"
                      )}
                      style={{ 
                        color: DRIVE_COLORS[d], 
                        borderColor: activeDrive === d ? DRIVE_COLORS[d] : undefined,
                        boxShadow: activeDrive === d ? `0 0 15px ${DRIVE_COLORS[d]}33` : undefined
                      }}
                    >
                      <span className="text-[10px] font-black">{d}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Active Drive Stats (Moved from left) */}
              <section>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Sector</span>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: DRIVE_COLORS[activeDrive] }} />
                  </div>
                  <div className="text-2xl font-black uppercase tracking-tight mb-1" style={{ color: DRIVE_COLORS[activeDrive] }}>
                    {activeDrive} DRIVE
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase opacity-60">
                    {terminals.find(t => t.label === activeDrive)?.subLabel} MODULE
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((allFiles.filter(f => f.driveId === activeDrive).length / 64) * 100, 100)}%` }}
                        className="h-full"
                        style={{ backgroundColor: DRIVE_COLORS[activeDrive] }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                      <span>Capacity</span>
                      <span>{allFiles.filter(f => f.driveId === activeDrive).length} / 64 Nodes</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button 
                      onClick={() => setExplorerConfig({ driveId: activeDrive })}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Explore
                    </button>
                    <label className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center cursor-pointer">
                      Upload
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              </section>

              {/* Database Connection */}
              <section>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4">Database Connection</h3>
                <div className="flex gap-2">
                  {["Neural Core", "External Archive", "Web Cache"].map(db => (
                    <button 
                      key={db}
                      onClick={() => setActiveDatabase(db)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                        activeDatabase === db ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                      )}
                    >
                      {db}
                    </button>
                  ))}
                </div>
              </section>

              {/* Quick Actions (Moved from left) */}
              <section>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-3 transition-all group">
                    <Globe className="w-3 h-3 text-slate-400 group-hover:text-cyan-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Web DB</span>
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-3 transition-all group">
                    <Shield className="w-3 h-3 text-slate-400 group-hover:text-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Scan</span>
                  </button>
                </div>
              </section>

              {/* Conversion Tools */}
              <section>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4">Neural Converters</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setConversionStatus("Ready for PDF to Word conversion. Use Agent chat to initiate.")} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                      <FileType size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-200">PDF → Word</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Extract & Reformat</div>
                    </div>
                  </button>
                  <button onClick={() => setConversionStatus("Ready for HTML to Media conversion.")} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Globe size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-200">HTML → Media</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Render to Image/PDF</div>
                    </div>
                  </button>
                </div>
              </section>

              {/* Agent Chat */}
              <section className="flex flex-col h-[400px]">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4">Agent Lee Assistant</h3>
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 no-scrollbar">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-8">
                      <MessageSquare size={32} className="mb-4" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting neural commands...</p>
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                        m.role === 'user' ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-100" : "bg-white/5 border border-white/10 text-slate-300"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-500 animate-pulse">
                      <Zap size={10} />
                      THINKING...
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAgentAction()}
                    placeholder="Ask Agent Lee..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-cyan-500/50 transition-all pr-12"
                  />
                  <button 
                    onClick={handleAgentAction}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    <Zap size={16} />
                  </button>
                </div>
              </section>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Neural Status</span>
                <span className="text-[10px] font-mono text-emerald-500 uppercase">Synchronized</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Settings size={14} />
                  Config
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  <RefreshCw size={14} />
                  Sync
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explorer Modal */}
      <AnimatePresence>
        {explorerConfig && (
          <FileExplorer 
            driveId={explorerConfig.driveId} 
            driveIds={explorerConfig.driveIds}
            slotId={explorerConfig.slotId} 
            cellId={explorerConfig.cellId} 
            onClose={() => setExplorerConfig(null)} 
            allFiles={allFiles}
            onEdit={(file: NeuralFile) => setEditingFile(file)}
            onTransfer={(file: NeuralFile, targets: DriveId[], mode: 'copy' | 'move') => handleTransferFile(file, targets, mode)}
          />
        )}
      </AnimatePresence>

      {/* File Editor Modal */}
      <AnimatePresence>
        {editingFile && (
          <FileEditor 
            file={editingFile} 
            onClose={() => setEditingFile(null)} 
            onSave={(content: string) => handleSaveEdit(editingFile, content)} 
          />
        )}
      </AnimatePresence>

      {/* Global Conversion Toast */}
      <AnimatePresence>
        {conversionStatus && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center gap-3"
          >
            <RefreshCw size={14} className="animate-spin" />
            {conversionStatus}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        :root {
          font-family: 'Inter', sans-serif;
        }
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
};

const Scene = ({ activeDrive, setActiveDrive, onCellClick, allFiles, terminals }: any) => {
  const securityNodes = useMemo(() => [
    { pos: [-3.5, 0, -3.5], drives: ["L", "E"] },
    { pos: [3.5, 0, -3.5], drives: ["O", "N"] },
    { pos: [3.5, 0, 3.5], drives: ["A", "R"] },
    { pos: [-3.5, 0, 3.5], drives: ["D", "LEE"] },
  ], []);

  const activeFileLinks = useMemo(() => {
    const links: { driveId: DriveId }[] = [];
    allFiles.filter((f: any) => f.driveId === activeDrive).forEach((f: any) => {
      if (f.links) links.push(...f.links);
    });
    return links;
  }, [allFiles, activeDrive]);

  return (
    <>
      <color attach="background" args={["#020204"]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <CoreCube activeDrive={activeDrive} onCellClick={onCellClick} allFiles={allFiles} />
      <DataFlowManager 
        terminals={terminals} 
        activeDrive={activeDrive} 
        activeFileLinks={activeFileLinks} 
        securityNodes={securityNodes}
      />
      
      {/* Security Nodes */}
      {securityNodes.map((n, i) => (
        <SecurityNode 
          key={i} 
          position={n.pos as [number, number, number]} 
          corruptFiles={allFiles.filter((f: any) => f.healthStatus === 'corrupt' && n.drives.includes(f.driveId))}
          onClick={() => onCellClick(undefined, undefined, n.drives)}
        />
      ))}
      
      {terminals.map((t: any, i: number) => (
        <Terminal 
          key={i} 
          position={t.pos as [number, number, number]} 
          color={t.color} 
          label={t.label} 
          subLabel={t.subLabel} 
          active={activeDrive === t.label}
          onClick={() => setActiveDrive(t.label as DriveId)}
          securityNodePos={securityNodes.find(n => n.drives.includes(t.label))?.pos as [number, number, number]}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0a0a10" roughness={0.4} metalness={0.3} />
      </mesh>
      <gridHelper args={[100, 50, "#444", "#222"]} position={[0, -1.99, 0]} />

      <ambientLight intensity={1.2} />
      <pointLight position={[10, 10, 10]} intensity={4.0} />
      <pointLight position={[-10, -10, -10]} color="#0088ff" intensity={2.0} />
      
      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={1} 
        maxDistance={25} 
        autoRotate={!activeDrive}
        autoRotateSpeed={0.3}
      />
    </>
  );
};

const FileExplorer = ({ driveId, driveIds, slotId, cellId, onClose, allFiles, onEdit, onTransfer }: any) => {
  const [files, setFiles] = useState<NeuralFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferringFile, setTransferringFile] = useState<NeuralFile | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let fs: NeuralFile[] = [];
      if (driveIds) {
        fs = allFiles.filter((f: any) => driveIds.includes(f.driveId) && f.healthStatus === 'corrupt');
      } else if (slotId !== undefined && cellId !== undefined) {
        fs = await neuralDB.getFiles(driveId, slotId, cellId);
      } else if (slotId !== undefined) {
        fs = await neuralDB.getFilesBySlot(driveId, slotId);
      } else {
        fs = allFiles.filter((f: any) => f.driveId === driveId);
      }
      setFiles(fs);
      setLoading(false);
    };
    load();
  }, [driveId, driveIds, slotId, cellId, allFiles]);

  const handleDownload = (file: NeuralFile) => {
    const blob = new Blob([file.content as string], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find all drives this file (by name/signature) exists in
  const getConnections = (file: NeuralFile): DriveId[] => {
    return Array.from(new Set(allFiles.filter((f: any) => f.name === file.name).map((f: any) => f.driveId))) as DriveId[];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="w-full max-w-4xl bg-[#0a0c10] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner" style={{ color: driveId ? DRIVE_COLORS[driveId as DriveId] : '#ff0000' }}>
              {driveIds ? <ShieldAlert size={32} /> : cellId !== undefined ? <Database size={32} /> : slotId !== undefined ? <Archive size={32} /> : <Folder size={32} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">{driveIds ? "Quarantine Zone" : "Neural Explorer"}</h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em] mt-1">
                {driveIds ? `Sectors: ${driveIds.join(', ')}` : `Drive: ${driveId} // Slot: ${slotId ?? 'ALL'} // Cell: ${cellId ?? 'ALL'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center opacity-30">
              <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6" />
              <span className="text-[10px] font-mono tracking-widest uppercase">Accessing Neural Sector...</span>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map(f => {
                const Icon = CATEGORY_ICONS[f.category] || FileText;
                const connections = getConnections(f);
                const isCorrupt = f.healthStatus === 'corrupt';
                const daysLeft = f.deletionDate ? Math.ceil((f.deletionDate - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div 
                    key={f.id} 
                    className={cn(
                      "relative flex flex-col gap-4 p-6 rounded-3xl transition-all group border",
                      isCorrupt 
                        ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" 
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                    )}
                  >
                    {/* Connection Dots */}
                    <div className="absolute top-4 right-4 flex gap-1 items-center">
                      {f.securityStatus === 'inspected' && (
                        <div className="mr-2 p-1 bg-cyan-500/20 rounded-full border border-cyan-500/40" title="Inspected by Security Bot">
                          <Shield size={10} className="text-cyan-400" />
                        </div>
                      )}
                      {connections.map((d: DriveId) => (
                        <div 
                          key={d} 
                          className="w-2 h-2 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" 
                          style={{ backgroundColor: DRIVE_COLORS[d] }}
                          title={`Connected to Drive ${d}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-5">
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner",
                          isCorrupt ? "bg-red-500/20 border-red-500/40" : "bg-black/50 border-white/5"
                        )} 
                        style={{ color: isCorrupt ? '#ef4444' : DRIVE_COLORS[driveId as DriveId] }}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-base font-bold truncate", isCorrupt ? "text-red-200" : "text-slate-200")}>
                          {f.name}
                          {f.locked && <span className="ml-2 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Locked</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                          <span>{f.category}</span>
                          <span className={isCorrupt ? "text-red-400 font-bold" : "text-cyan-500"}>{f.healthStatus}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!f.locked && (
                          <>
                            <button 
                              onClick={() => setTransferringFile(f)}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                              title="Transfer File"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button 
                              onClick={() => onEdit(f)}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                              title="Edit File"
                            >
                              <Code size={18} />
                            </button>
                          </>
                        )}
                        {isCorrupt && (
                          <button 
                            onClick={async () => {
                              const updatedFile: NeuralFile = {
                                ...f,
                                healthStatus: 'healthy',
                                locked: false,
                                deletionDate: undefined,
                                history: [...(f.history || []), { action: 'Unlocked by User', actor: 'User_Alex', timestamp: Date.now() }]
                              };
                              await neuralDB.addFile(updatedFile);
                              const fs = await neuralDB.getFiles(driveId, slotId, cellId);
                              setFiles(fs);
                            }}
                            className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all"
                            title="Unlock File"
                          >
                            <Zap size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownload(f)}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                          title="Download File"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest text-slate-500">
                        <span>Origin: <span className="text-slate-300">{f.origin || 'unknown'} ({f.createdBy || 'unknown'})</span></span>
                        <span>Last Handled: <span className="text-slate-300">{f.lastHandledBy || 'unknown'}</span></span>
                      </div>
                      {isCorrupt && daysLeft !== null && (
                        <div className="flex justify-between items-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          <span className="text-[8px] font-mono text-red-400 uppercase font-bold">Auto-Deletion in {daysLeft} days</span>
                          <button 
                            onClick={async () => {
                              const updatedFile: NeuralFile = {
                                ...f,
                                deletionDate: (f.deletionDate || Date.now()) + (7 * 24 * 60 * 60 * 1000),
                                history: [...(f.history || []), { action: 'Deletion Deferred', actor: 'User_Alex', timestamp: Date.now() }]
                              };
                              await neuralDB.addFile(updatedFile);
                              const fs = await neuralDB.getFiles(driveId, slotId, cellId);
                              setFiles(fs);
                            }}
                            className="text-[8px] font-black text-red-400 uppercase hover:text-red-300 underline"
                          >
                            +7 Days
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {(f.history || []).slice(-3).map((h, i) => (
                          <div key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[7px] text-slate-400 font-mono">
                            {h.action} by {h.actor}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-20">
              <Database size={48} className="mb-6" />
              <span className="text-[10px] font-mono tracking-widest uppercase">No data fragments found in this sector</span>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Total Nodes: {files.length}
          </div>
          <button onClick={onClose} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            Close Explorer
          </button>
        </div>
      </div>

      <AnimatePresence>
        {transferringFile && (
          <TransferModal 
            file={transferringFile} 
            onClose={() => setTransferringFile(null)} 
            onTransfer={(targets: string[], mode: string) => {
              onTransfer(transferringFile, targets, mode);
              setTransferringFile(null);
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TransferModal = ({ file, onClose, onTransfer }: any) => {
  const [selectedDrives, setSelectedDrives] = useState<DriveId[]>([]);
  const [mode, setMode] = useState<'copy' | 'move'>('copy');
  const drives = Object.keys(DRIVE_COLORS) as DriveId[];

  const toggleDrive = (d: DriveId) => {
    setSelectedDrives(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const selectAll = () => {
    setSelectedDrives(drives.filter(d => d !== file.driveId));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-[#0a0c10] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="text-cyan-400" size={20} />
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Neural Transfer</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Transferring File</p>
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm font-bold text-slate-200">
              {file.name}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Target Drives</p>
              <button onClick={selectAll} className="text-[9px] font-black text-cyan-500 uppercase hover:text-cyan-400 transition-colors">Select All</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {drives.map(d => (
                <button
                  key={d}
                  disabled={d === file.driveId}
                  onClick={() => toggleDrive(d)}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] font-black transition-all",
                    selectedDrives.includes(d) 
                      ? "bg-white/10 border-white/40" 
                      : "bg-white/5 border-white/5 opacity-40 hover:opacity-100",
                    d === file.driveId && "cursor-not-allowed opacity-10"
                  )}
                  style={{ color: DRIVE_COLORS[d], borderColor: selectedDrives.includes(d) ? DRIVE_COLORS[d] : undefined }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setMode('copy')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                mode === 'copy' ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/5 text-slate-500"
              )}
            >
              Copy
            </button>
            <button 
              onClick={() => setMode('move')}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                mode === 'move' ? "bg-amber-500/10 border-amber-500/50 text-amber-400" : "bg-white/5 border-white/5 text-slate-500"
              )}
            >
              Move
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            Cancel
          </button>
          <button 
            disabled={selectedDrives.length === 0}
            onClick={() => onTransfer(selectedDrives, mode)}
            className="flex-[2] py-4 bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          >
            Execute {mode}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const FileEditor = ({ file, onClose, onSave }: any) => {
  const [content, setContent] = useState(file.content || "");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="w-full max-w-5xl bg-[#0a0c10] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Code size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Neural Editor</h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Editing: {file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-8">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-xs text-slate-300 focus:outline-none focus:border-amber-500/30 resize-none leading-relaxed"
          />
        </div>
        <div className="p-8 border-t border-white/5 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={() => onSave(content)} className="px-10 py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            Commit Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Pallium;
