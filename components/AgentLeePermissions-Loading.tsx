/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.APP.SURFACE
TAG: UI.COMPONENT.SYSTEM.PERMISSIONS_LOADING

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=shield-check

5WH:
WHAT = Agent Lee System OS initialization and permissions prompt
WHY = Gatekeeper screen to acquire necessary hardware authorizations prior to OS boot
WHO = Agent Lee Creator
WHERE = components/AgentLeePermissions-Loading.tsx
WHEN = 2026
HOW = React + framer-motion UI overlay

AGENTS:
AZR
PHI3
GEMINI
QWEN
LLAMA
ECHO

LICENSE:
MIT
*/

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Enums ---

export interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: number;
}

export interface SimulationVoxel {
  id: number;
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  rvx: number;
  rvy: number;
  rvz: number;
}

export interface RebuildTarget {
  x: number;
  y: number;
  z: number;
  delay: number;
  isRubble?: boolean;
}

export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

// --- Constants ---

export const COLORS = {
    WOOD: 0x8B4513,
    GREEN: 0x228B22,
    DARK: 0x333333,
    LIGHT: 0xCCCCCC,
    WHITE: 0xFFFFFF,
    BLACK: 0x000000,
    GOLD: 0xFFD700,
    TALON: 0xFFA500,
};

export const CONFIG = {
    BG_COLOR: 0xf8fafc,
    FLOOR_Y: -10,
    VOXEL_SIZE: 1.0,
};

const LOADING_TIME_MS = 15000; // 15 seconds total loading
const MORPH_INTERVAL_MS = 3000; // Morph every 3 seconds

// --- Voxel Generators ---

function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function generateSphere(map: Map<string, VoxelData>, cx: number, cy: number, cz: number, r: number, col: number, sy = 1) {
    const r2 = r * r;
    const xMin = Math.floor(cx - r);
    const xMax = Math.ceil(cx + r);
    const yMin = Math.floor(cy - r * sy);
    const yMax = Math.ceil(cy + r * sy);
    const zMin = Math.floor(cz - r);
    const zMax = Math.ceil(cz + r);

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            for (let z = zMin; z <= zMax; z++) {
                const dx = x - cx;
                const dy = (y - cy) / sy;
                const dz = z - cz;
                if (dx * dx + dy * dy + dz * dz <= r2) {
                    setBlock(map, x, y, z, col);
                }
            }
        }
    }
}

export const Generators = {
    Eagle: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        for (let x = -8; x < 8; x++) {
            const y = Math.sin(x * 0.2) * 1.5;
            const z = Math.cos(x * 0.1) * 1.5;
            generateSphere(map, x, y, z, 1.8, COLORS.WOOD);
            if (Math.random() > 0.7) generateSphere(map, x, y + 2, z + (Math.random() - 0.5) * 3, 1.5, COLORS.GREEN);
        }
        const EX = 0, EY = 2, EZ = 2;
        generateSphere(map, EX, EY + 6, EZ, 4.5, COLORS.DARK, 1.4);
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY + 4; y <= EY + 9; y++) setBlock(map, x, y, EZ + 3, COLORS.LIGHT);
        for (let x of [-4, -3, 3, 4]) for (let y = EY + 4; y <= EY + 10; y++) for (let z = EZ - 2; z <= EZ + 3; z++) setBlock(map, x, y, z, COLORS.DARK);
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY; y <= EY + 4; y++) for (let z = EZ - 5; z <= EZ - 3; z++) setBlock(map, x, y, z, COLORS.WHITE);
        const HY = EY + 12, HZ = EZ + 1;
        generateSphere(map, EX, HY, HZ, 2.8, COLORS.WHITE);
        generateSphere(map, EX, HY - 2, HZ, 2.5, COLORS.WHITE);
        [[-2, 0], [-2, 1], [2, 0], [2, 1]].forEach(o => setBlock(map, EX + o[0], EY + o[1], EZ, COLORS.TALON));
        [[0, 1], [0, 2], [1, 1], [-1, 1]].forEach(o => setBlock(map, EX + o[0], HY, HZ + 2 + o[1], COLORS.GOLD));
        setBlock(map, EX, HY - 1, HZ + 3, COLORS.GOLD);
        [[-1.5, COLORS.BLACK], [1.5, COLORS.BLACK]].forEach(o => setBlock(map, EX + o[0], HY + 0.5, HZ + 1.5, o[1]));
        [[-1.5, COLORS.WHITE], [1.5, COLORS.WHITE]].forEach(o => setBlock(map, EX + o[0], HY + 1.5, HZ + 1.5, o[1]));
        return Array.from(map.values());
    },
    Cat: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1; const CX = 0, CZ = 0;
        generateSphere(map, CX - 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        generateSphere(map, CX + 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        for (let y = 0; y < 7; y++) {
            const r = 3.5 - (y * 0.2);
            generateSphere(map, CX, CY + 2 + y, CZ, r, COLORS.DARK);
            generateSphere(map, CX, CY + 2 + y, CZ + 2, r * 0.6, COLORS.WHITE);
        }
        for (let y = 0; y < 5; y++) {
            setBlock(map, CX - 1.5, CY + y, CZ + 3, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 3, COLORS.WHITE);
            setBlock(map, CX - 1.5, CY + y, CZ + 2, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 2, COLORS.WHITE);
        }
        const CHY = CY + 9;
        generateSphere(map, CX, CHY, CZ, 3.2, COLORS.LIGHT, 0.8);
        [[-2, 1], [2, 1]].forEach(side => {
            setBlock(map, CX + side[0], CHY + 3, CZ, COLORS.DARK); setBlock(map, CX + side[0] * 0.8, CHY + 3, CZ + 1, COLORS.WHITE);
            setBlock(map, CX + side[0], CHY + 4, CZ, COLORS.DARK);
        });
        for (let i = 0; i < 12; i++) {
            const a = i * 0.3, tx = Math.cos(a) * 4.5, tz = Math.sin(a) * 4.5;
            if (tz > -2) { setBlock(map, CX + tx, CY, CZ + tz, COLORS.DARK); setBlock(map, CX + tx, CY + 1, CZ + tz, COLORS.DARK); }
        }
        setBlock(map, CX - 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD); setBlock(map, CX + 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD);
        setBlock(map, CX - 1, CHY + 0.5, CZ + 3, COLORS.BLACK); setBlock(map, CX + 1, CHY + 0.5, CZ + 3, COLORS.BLACK);
        setBlock(map, CX, CHY, CZ + 3, COLORS.TALON);
        return Array.from(map.values());
    },
    Rabbit: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const LOG_Y = CONFIG.FLOOR_Y + 2.5;
        const RX = 0, RZ = 0;
        for (let x = -6; x <= 6; x++) {
            const radius = 2.8 + Math.sin(x * 0.5) * 0.2;
            generateSphere(map, x, LOG_Y, 0, radius, COLORS.DARK);
            if (x === -6 || x === 6) generateSphere(map, x, LOG_Y, 0, radius - 0.5, COLORS.WOOD);
            if (Math.random() > 0.8) setBlock(map, x, LOG_Y + radius, (Math.random() - 0.5) * 2, COLORS.GREEN);
        }
        const BY = LOG_Y + 2.5;
        generateSphere(map, RX - 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX + 1.5, BY + 1.5, RZ - 1.5, 1.8, COLORS.WHITE);
        generateSphere(map, RX, BY + 2, RZ, 2.2, COLORS.WHITE, 0.8);
        generateSphere(map, RX, BY + 2.5, RZ + 1.5, 1.5, COLORS.WHITE);
        setBlock(map, RX - 1.2, BY, RZ + 2.2, COLORS.LIGHT); setBlock(map, RX + 1.2, BY, RZ + 2.2, COLORS.LIGHT);
        setBlock(map, RX - 2.2, BY, RZ - 0.5, COLORS.WHITE); setBlock(map, RX + 2.2, BY, RZ - 0.5, COLORS.WHITE);
        generateSphere(map, RX, BY + 1.5, RZ - 2.5, 1.0, COLORS.WHITE);
        const HY = BY + 4.5; const HZ = RZ + 1;
        generateSphere(map, RX, HY, HZ, 1.7, COLORS.WHITE);
        generateSphere(map, RX - 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        generateSphere(map, RX + 1.1, HY - 0.5, HZ + 0.5, 1.0, COLORS.WHITE);
        for (let y = 0; y < 5; y++) {
            const curve = y * 0.2;
            setBlock(map, RX - 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX - 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX - 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
            setBlock(map, RX + 0.8, HY + 1.5 + y, HZ - curve, COLORS.WHITE); setBlock(map, RX + 1.2, HY + 1.5 + y, HZ - curve, COLORS.WHITE);
            setBlock(map, RX + 1.0, HY + 1.5 + y, HZ - curve + 0.5, COLORS.LIGHT);
        }
        setBlock(map, RX - 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK); setBlock(map, RX + 0.8, HY + 0.2, HZ + 1.5, COLORS.BLACK);
        setBlock(map, RX, HY - 0.5, HZ + 1.8, COLORS.TALON);
        return Array.from(map.values());
    },
    Twins: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        function buildMiniEagle(offsetX: number, offsetZ: number) {
            for (let x = -5; x < 5; x++) {
                const y = Math.sin(x * 0.4) * 0.5;
                generateSphere(map, offsetX + x, y, offsetZ, 1.2, COLORS.WOOD);
                if (Math.random() > 0.8) generateSphere(map, offsetX + x, y + 1, offsetZ, 1, COLORS.GREEN);
            }
            const EX = offsetX, EY = 1.5, EZ = offsetZ;
            generateSphere(map, EX, EY + 4, EZ, 3.0, COLORS.DARK, 1.4);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 6; y++) setBlock(map, x, y, EZ + 2, COLORS.LIGHT);
            for (let x = EX - 1; x <= EX + 1; x++) for (let y = EY + 2; y <= EY + 3; y++) setBlock(map, x, y, EZ - 3, COLORS.WHITE);
            for (let y = EY + 2; y <= EY + 6; y++) for (let z = EZ - 1; z <= EZ + 2; z++) { setBlock(map, EX - 3, y, z, COLORS.DARK); setBlock(map, EX + 3, y, z, COLORS.DARK); }
            const HY = EY + 8, HZ = EZ + 1;
            generateSphere(map, EX, HY, HZ, 2.0, COLORS.WHITE);
            setBlock(map, EX, HY, HZ + 2, COLORS.GOLD); setBlock(map, EX, HY - 0.5, HZ + 2, COLORS.GOLD);
            setBlock(map, EX - 1, HY + 0.5, HZ + 1, COLORS.BLACK); setBlock(map, EX + 1, HY + 0.5, HZ + 1, COLORS.BLACK);
            setBlock(map, EX - 1, EY, EZ, COLORS.TALON); setBlock(map, EX + 1, EY, EZ, COLORS.TALON);
        }
        buildMiniEagle(-10, 2);
        buildMiniEagle(10, -2);
        return Array.from(map.values());
    }
};

const MODELS = [
  { name: 'Eagle', generator: Generators.Eagle },
  { name: 'Cat', generator: Generators.Cat },
  { name: 'Rabbit', generator: Generators.Rabbit },
  { name: 'Twins', generator: Generators.Twins },
];

// --- Voxel Engine ---

export class VoxelEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private instanceMesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  
  private voxels: SimulationVoxel[] = [];
  private rebuildTargets: RebuildTarget[] = [];
  private rebuildStartTime: number = 0;
  
  private state: AppState = AppState.STABLE;
  private onStateChange: (state: AppState) => void;
  private onCountChange: (count: number) => void;
  private animationId: number = 0;

  constructor(
    container: HTMLElement, 
    onStateChange: (state: AppState) => void,
    onCountChange: (count: number) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(30, 30, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 5, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 80, 30);
    this.scene.add(dirLight);

    const planeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), planeMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.FLOOR_Y;
    this.scene.add(floor);

    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    const poolSize = Math.max(data.length, 1000);
    this.createVoxels(data, poolSize);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[], poolSize: number) {
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      if (Array.isArray(this.instanceMesh.material)) {
          this.instanceMesh.material.forEach(m => m.dispose());
      } else {
          this.instanceMesh.material.dispose();
      }
    }

    this.voxels = [];
    for (let i = 0; i < poolSize; i++) {
        const source = data[i % data.length];
        const c = new THREE.Color(source.color);
        c.offsetHSL(0, 0, (Math.random() * 0.1) - 0.05);
        
        this.voxels.push({
            id: i,
            x: source.x, y: source.y, z: source.z, color: c,
            vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0,
            rvx: 0, rvy: 0, rvz: 0
        });
    }

    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05);
    const material = new THREE.MeshLambertMaterial();
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, poolSize);
    this.scene.add(this.instanceMesh);

    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    this.voxels.forEach((v, i) => {
        this.dummy.position.set(v.x, v.y, v.z);
        this.dummy.rotation.set(v.rx, v.ry, v.rz);
        
        if (this.state === AppState.STABLE && this.rebuildTargets[i]?.isRubble) {
            this.dummy.scale.set(0, 0, 0);
        } else {
            this.dummy.scale.set(1, 1, 1);
        }
        
        this.dummy.updateMatrix();
        this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);
        this.instanceMesh!.setColorAt(i, v.color);
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
    if (this.instanceMesh.instanceColor) this.instanceMesh.instanceColor.needsUpdate = true;
  }

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);

    this.voxels.forEach(v => {
        v.vx = (Math.random() - 0.5) * 1.5;
        v.vy = Math.random() * 1.0 + 0.5;
        v.vz = (Math.random() - 0.5) * 1.5;
        v.rvx = (Math.random() - 0.5) * 0.4;
        v.rvy = (Math.random() - 0.5) * 0.4;
        v.rvz = (Math.random() - 0.5) * 0.4;
    });
  }

  private getColorDist(c1: THREE.Color, hex2: number): number {
    const c2 = new THREE.Color(hex2);
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) + 
        Math.pow(c1.g - c2.g, 2) + 
        Math.pow(c1.b - c2.b, 2)
    );
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;

    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);
    const available = [...this.voxels.keys()];
    
    const colorGroups: Map<string, number[]> = new Map();
    available.forEach(idx => {
        const hex = '#' + this.voxels[idx].color.getHexString();
        if (!colorGroups.has(hex)) colorGroups.set(hex, []);
        colorGroups.get(hex)!.push(idx);
    });

    targetModel.forEach(target => {
        const targetHex = '#' + new THREE.Color(target.color).getHexString();
        let bestIdx = -1;

        const group = colorGroups.get(targetHex);
        if (group && group.length > 0) {
            bestIdx = group.pop()!;
        } else {
            let minD = 999;
            let bestColorKey = '';
            for (const [hex, indices] of colorGroups.entries()) {
                if (indices.length === 0) continue;
                const d = this.getColorDist(new THREE.Color(hex), target.color);
                if (d < minD) {
                    minD = d;
                    bestColorKey = hex;
                }
            }
            if (bestColorKey) {
                bestIdx = colorGroups.get(bestColorKey)!.pop()!;
            }
        }

        if (bestIdx !== -1) {
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
            mappings[bestIdx] = {
                x: target.x, y: target.y, z: target.z,
                delay: h * 400
            };
        }
    });

    for (let i = 0; i < this.voxels.length; i++) {
        if (!mappings[i]) {
            mappings[i] = {
                x: this.voxels[i].x, y: this.voxels[i].y, z: this.voxels[i].z,
                isRubble: true, delay: 0
            };
        }
    }

    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    if (this.state === AppState.DISMANTLING) {
        this.voxels.forEach(v => {
            v.vy -= 0.04;
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;

            if (v.y < CONFIG.FLOOR_Y + 0.5) {
                v.y = CONFIG.FLOOR_Y + 0.5;
                v.vy *= -0.4; v.vx *= 0.85; v.vz *= 0.85;
                v.rvx *= 0.7; v.rvy *= 0.7; v.rvz *= 0.7;
            }
        });
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;

        this.voxels.forEach((v, i) => {
            const t = this.rebuildTargets[i];
            if (t.isRubble) {
                v.vy -= 0.04;
                v.x += v.vx; v.y += v.vy; v.z += v.vz;
                if (v.y < CONFIG.FLOOR_Y + 0.5) {
                    v.y = CONFIG.FLOOR_Y + 0.5;
                    v.vy *= -0.3; v.vx *= 0.8; v.vz *= 0.8;
                }
                return;
            }

            if (elapsed < t.delay) {
                allDone = false;
                return;
            }

            const speed = 0.18;
            v.x += (t.x - v.x) * speed;
            v.y += (t.y - v.y) * speed;
            v.z += (t.z - v.z) * speed;
            v.rx += (0 - v.rx) * speed;
            v.ry += (0 - v.ry) * speed;
            v.rz += (0 - v.rz) * speed;

            if (Math.abs(t.x - v.x) > 0.05 || Math.abs(t.y - v.y) > 0.05 || Math.abs(t.z - v.z) > 0.05) {
                allDone = false;
            } else {
                v.x = t.x; v.y = t.y; v.z = t.z;
                v.rx = 0; v.ry = 0; v.rz = 0;
            }
        });

        if (allDone) {
            this.state = AppState.STABLE;
            this.onStateChange(this.state);
        }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    
    if (this.state !== AppState.STABLE || this.controls.autoRotate) {
        this.draw();
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
      if (this.camera && this.renderer && this.container) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
  }
  
  public cleanup() {
    cancelAnimationFrame(this.animationId);
    if (this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}

// --- Components ---

interface LoadingViewProps {
  progress: number;
}

function LoadingView({ progress }: LoadingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  const [state, setState] = useState<AppState>(AppState.STABLE);
  const loopStartedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setState(newState),
      () => {}
    );
    engineRef.current = engine;

    const initialModel = MODELS[0].generator();
    engine.loadInitialModel(initialModel);

    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.cleanup();
    };
  }, []);

  useEffect(() => {
    const morphInterval = setInterval(() => {
      if (!engineRef.current || state !== AppState.STABLE) return;
      
      setCurrentModelIndex((prev) => {
        const nextIndex = (prev + 1) % MODELS.length;
        
        loopStartedRef.current = true;

        engineRef.current?.dismantle();
        
        setTimeout(() => {
          if (engineRef.current) {
            const nextModel = MODELS[nextIndex].generator();
            engineRef.current.rebuild(nextModel);
          }
        }, 1000);
        
        return nextIndex;
      });
    }, MORPH_INTERVAL_MS);

    return () => {
      clearInterval(morphInterval);
    };
  }, [state]);

  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  return (
    <motion.div 
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0 bg-[#f8fafc]"
    >
      <div ref={containerRef} className="w-full h-full opacity-90" />

      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-12 md:p-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="space-y-4 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-black uppercase text-slate-900 italic tracking-tighter leading-none"
            >
              Agent Lee: Agentic Operating System
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-[10px] md:text-xs font-bold tracking-[1em] uppercase text-slate-500"
            >
              Initializing Kernel Subsystems
            </motion.div>
          </div>
        </motion.div>

        <div className="w-full max-w-md space-y-4">
          <div className="relative h-[1px] w-full bg-slate-200 overflow-hidden">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-slate-900 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
              style={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            />
          </div>
          
          <div className="flex justify-between items-center text-[9px] tracking-[0.4em] uppercase text-slate-600 font-bold">
            <span>Loading</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PermissionsLoading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const logAction = (type: string, message: string) => {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('agent_lee_logs') || '[]');
      const newLog = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('agent_lee_logs', JSON.stringify([newLog, ...existingLogs]));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!permissionsGranted || isLoaded) return;

    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, (elapsed / LOADING_TIME_MS) * 100);
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        logAction('system', 'Kernel subsystems initialized. Agent Lee is now conscious.');
      }
    }, 50);

    logAction('system', 'Starting boot sequence. Re-assembling consciousness matrix.');

    return () => {
      clearInterval(progressInterval);
    };
  }, [permissionsGranted, isLoaded]);

  useEffect(() => {
    if (progress >= 100 && !isLoaded) {
      const timer = setTimeout(() => setIsLoaded(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress, isLoaded]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f8fafc] font-mono text-slate-900 shadow-[inset_0_0_120px_rgba(15,23,42,0.15)] transition-shadow duration-1000">
      <AnimatePresence mode="wait">
        {!permissionsGranted ? (
          <motion.div 
            key="permissions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center bg-[#f8fafc]"
          >
            <div className="max-w-md space-y-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
              >
                <h2 className="text-xl font-black uppercase tracking-[0.4em] text-slate-900">System Access</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                  Agent Lee requires authorization to access hardware subsystems for optimal performance.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 gap-4 text-[10px] uppercase tracking-widest">
                {['Camera', 'Microphone', 'Geolocation'].map((perm) => (
                  <div key={perm} className="flex items-center justify-between p-4 border border-slate-200 bg-white shadow-sm">
                    <span className="text-slate-400">{perm} Access</span>
                    <span className="text-slate-900 font-bold">Required</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#0f172a', color: '#fff' }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  logAction('permissions', 'Requesting hardware subsystem authorization (Camera, Mic, GPS).');
                  try {
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    await new Promise((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    logAction('permissions', 'Sensory inputs engaged. Authorizations granted.');
                  } catch (err) {
                    console.warn("Permissions not fully granted:", err);
                    logAction('permissions', 'Warning: Partial sensory deprivation. Authorizations denied or unavailable.');
                  } finally {
                    setPermissionsGranted(true);
                  }
                }}
                className="w-full py-4 border-2 border-slate-900 text-slate-900 font-black uppercase tracking-[0.3em] transition-colors duration-300 pointer-events-auto"
              >
                Authorize System
              </motion.button>
            </div>
          </motion.div>
        ) : !isLoaded ? (
          <LoadingView progress={progress} />
        ) : (
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8fafc]"
          >
            <div className="text-center space-y-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[0.5em] text-slate-900 italic">Welcome</h1>
                <p className="text-xs text-slate-500 uppercase tracking-[1em] mt-4">System Online</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="pt-12"
              >
                <button onClick={onComplete} className="px-8 py-3 bg-slate-900 text-white text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all duration-500 pointer-events-auto shadow-[0_0_20px_rgba(15,23,42,0.5)]">
                  Access Dashboard
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(0,0,0,0.03),rgba(0,0,0,0.01),rgba(0,0,0,0.03))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
}
