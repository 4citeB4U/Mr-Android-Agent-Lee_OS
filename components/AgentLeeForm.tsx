import { AgentLeeCameraPopup } from './AgentLeeCameraPopup';

// ...existing code...

// Place all useState, useEffect, etc. inside your component, not at the top level
// --- Agent Lee global awareness ---
function useAgentLeeAwareness(onUserActivity: (activity: { type: string, detail?: any }) => void) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => onUserActivity({ type: 'keystroke', detail: { key: e.key, value: (e.target as any)?.value } });
    const handleInput = (e: InputEvent) => onUserActivity({ type: 'input', detail: { value: (e.target as any)?.value } });
    const handleClick = (e: MouseEvent) => onUserActivity({ type: 'click', detail: { x: e.clientX, y: e.clientY } });
    const handleNav = () => onUserActivity({ type: 'navigation', detail: { url: window.location.href } });
    window.addEventListener('keydown', handleKey);
    window.addEventListener('input', handleInput, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handleNav);
    window.addEventListener('pushstate', handleNav);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('input', handleInput, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handleNav);
      window.removeEventListener('pushstate', handleNav);
    };
  }, [onUserActivity]);
}
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.AGENT.FORM
TAG: UI.COMPONENT.AGENT.AGENTLEEFORM.ENGINE

COLOR_ONION_HEX:
NEON=#FFD700
FLUO=#FFF176
PASTEL=#FFF9C4

ICON_ASCII:
family=lucide
glyph=cpu

5WH:
WHAT = Agent Lee 3D interactive form — the primary conversational and visual interface body for Lee Prime
WHY = Renders the Agent Lee avatar in a Three.js 3D frame with full chat, voice, file upload, and tool surface integration
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentLeeForm.tsx
WHEN = 2026
HOW = React component with Three.js scene, LeewayInferenceClient integration, EventBus bindings, and Lucide icons for all UI controls

AGENTS:
ASSESS
AUDIT
leeway
AGENT_LEE

LICENSE:
MIT
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Mic, Send, Share2, Image as ImageIcon, Loader2, Volume2, VolumeX, FolderHeart, Download } from 'lucide-react';
import { eventBus } from '../core/EventBus';
import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { sendTTS } from '../core/ttsBridge';

const CORE_SYSTEM = buildAgentLeeCorePrompt();
// --- Types & Enums ---
export enum AppState {
  STABLE = 'STABLE',
  DISMANTLING = 'DISMANTLING',
  REBUILDING = 'REBUILDING'
}

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

// --- Constants ---
const COLORS = {
  DARK: 0x4A3728,
  LIGHT: 0x654321,
  WHITE: 0xF0F0F0,
  GOLD: 0xFFD700,
  BLACK: 0x111111,
  WOOD: 0x3B2F2F,
  GREEN: 0x228B22,
  TALON: 0xE5C100,
};

const CONFIG = {
  VOXEL_SIZE: 1,
  FLOOR_Y: -12,
  BG_COLOR: 0xf0f2f5,
};

// --- Generators ---
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

const Generators = {
    Eagle: (): VoxelData[] => {
      const map = new Map<string, VoxelData>();
      // More detailed body and wings
      for (let x = -10; x < 10; x++) {
        for (let z = -2; z <= 2; z++) {
          const y = Math.sin(x * 0.18) * 2 + Math.cos(z * 0.5) * 0.5;
          generateSphere(map, x, y, z, 1.7, COLORS.WOOD);
          if (Math.random() > 0.6) generateSphere(map, x, y + 2, z + (Math.random() - 0.5) * 3, 1.2, COLORS.GREEN);
        }
      }
      const EX = 0, EY = 2, EZ = 2;
      generateSphere(map, EX, EY + 6, EZ, 5.2, COLORS.DARK, 1.5);
      for (let x = EX - 3; x <= EX + 3; x++) for (let y = EY + 4; y <= EY + 10; y++) setBlock(map, x, y, EZ + 3, COLORS.LIGHT);
      for (let x of [-5, -4, 4, 5]) for (let y = EY + 4; y <= EY + 12; y++) for (let z = EZ - 3; z <= EZ + 4; z++) setBlock(map, x, y, z, COLORS.DARK);
      for (let x = EX - 3; x <= EX + 3; x++) for (let y = EY; y <= EY + 5; y++) for (let z = EZ - 6; z <= EZ - 2; z++) setBlock(map, x, y, z, COLORS.WHITE);
      const HY = EY + 14, HZ = EZ + 1;
      generateSphere(map, EX, HY, HZ, 3.2, COLORS.WHITE);
      generateSphere(map, EX, HY - 2, HZ, 2.8, COLORS.WHITE);
      [[-2, 0], [-2, 1], [2, 0], [2, 1]].forEach(o => setBlock(map, EX + o[0], EY + o[1], EZ, COLORS.TALON));
      [[0, 1], [0, 2], [1, 1], [-1, 1]].forEach(o => setBlock(map, EX + o[0], HY, HZ + 2 + o[1], COLORS.GOLD));
      setBlock(map, EX, HY - 1, HZ + 3, COLORS.GOLD);
      [[-1.5, COLORS.BLACK], [1.5, COLORS.BLACK]].forEach(o => setBlock(map, EX + o[0], HY + 0.5, HZ + 1.5, o[1]));
      [[-1.5, COLORS.WHITE], [1.5, COLORS.WHITE]].forEach(o => setBlock(map, EX + o[0], HY + 1.5, HZ + 1.5, o[1]));
      // Add more tail and feather detail
      for (let i = -2; i <= 2; i++) setBlock(map, EX, EY - 2, EZ + i, COLORS.WHITE);
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
        function buildMiniEagle(offsetX: number, offsetZ: number, mirror: boolean) {
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
        buildMiniEagle(-10, 2, false);
        buildMiniEagle(10, -2, true);
        return Array.from(map.values());
    }
};

// --- Voxel Engine ---
class VoxelEngine {
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

  constructor(container: HTMLElement, onStateChange: (state: AppState) => void, onCountChange: (count: number) => void) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onCountChange = onCountChange;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Set background to black
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    // Adjust camera for small mode (tighter, closer, centered)
    if (w < 200) {
      this.camera.position.set(0, 10, 65); // Closer
      this.scene.fog = null; // No fog in small mode for clarity
    } else {
      this.camera.position.set(30, 30, 60);
      this.scene.fog = new THREE.Fog(0x000000, 60, 140);
    }
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 5, 0);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);
    this.scene.add(dirLight);
    
    // Only show floor in large mode
    if (w >= 200) {
      const planeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 }); // Floor darker
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), planeMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = CONFIG.FLOOR_Y;
      floor.receiveShadow = true;
      this.scene.add(floor);
    }
    
    this.animate = this.animate.bind(this);
    this.animate();
  }

  public loadInitialModel(data: VoxelData[]) {
    this.createVoxels(data);
    this.onCountChange(this.voxels.length);
    this.state = AppState.STABLE;
    this.onStateChange(this.state);
  }

  private createVoxels(data: VoxelData[]) {
    if (this.instanceMesh) {
      this.scene.remove(this.instanceMesh);
      this.instanceMesh.geometry.dispose();
      if (Array.isArray(this.instanceMesh.material)) this.instanceMesh.material.forEach(m => m.dispose());
      else this.instanceMesh.material.dispose();
    }
    this.voxels = data.map((v, i) => ({
      id: i, x: v.x, y: v.y, z: v.z, color: new THREE.Color(v.color),
      vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, rvx: 0, rvy: 0, rvz: 0
    }));
    const geometry = new THREE.BoxGeometry(CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05, CONFIG.VOXEL_SIZE - 0.05);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 });
    this.instanceMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instanceMesh.castShadow = true;
    this.instanceMesh.receiveShadow = true;
    this.scene.add(this.instanceMesh);
    this.draw();
  }

  private draw() {
    if (!this.instanceMesh) return;
    this.voxels.forEach((v, i) => {
        this.dummy.position.set(v.x, v.y, v.z);
        this.dummy.rotation.set(v.rx, v.ry, v.rz);
        this.dummy.updateMatrix();
        this.instanceMesh!.setMatrixAt(i, this.dummy.matrix);
        this.instanceMesh!.setColorAt(i, v.color);
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
    this.instanceMesh.instanceColor!.needsUpdate = true;
  }

  public dismantle() {
    if (this.state !== AppState.STABLE) return;
    this.state = AppState.DISMANTLING;
    this.onStateChange(this.state);
    this.voxels.forEach(v => {
        v.vx = (Math.random() - 0.5) * 0.8;
        v.vy = Math.random() * 0.5;
        v.vz = (Math.random() - 0.5) * 0.8;
        v.rvx = (Math.random() - 0.5) * 0.2;
        v.rvy = (Math.random() - 0.5) * 0.2;
        v.rvz = (Math.random() - 0.5) * 0.2;
    });
  }

  public rebuild(targetModel: VoxelData[]) {
    if (this.state === AppState.REBUILDING) return;
    const available = this.voxels.map((v, i) => ({ index: i, color: v.color, taken: false }));
    const mappings: RebuildTarget[] = new Array(this.voxels.length).fill(null);
    targetModel.forEach(target => {
        let bestDist = 9999;
        let bestIdx = -1;
        for (let i = 0; i < available.length; i++) {
            if (available[i].taken) continue;
            const c2 = new THREE.Color(target.color);
            const d = Math.sqrt(Math.pow(available[i].color.r - c2.r, 2) + Math.pow(available[i].color.g - c2.g, 2) + Math.pow(available[i].color.b - c2.b, 2));
            if (d < bestDist) { bestDist = d; bestIdx = i; if (d < 0.01) break; }
        }
        if (bestIdx !== -1) {
            available[bestIdx].taken = true;
            const h = Math.max(0, (target.y - CONFIG.FLOOR_Y) / 15);
            mappings[available[bestIdx].index] = { x: target.x, y: target.y, z: target.z, delay: h * 800 };
        }
    });
    for (let i = 0; i < this.voxels.length; i++) {
        if (!mappings[i]) mappings[i] = { x: 0, y: CONFIG.FLOOR_Y - 10, z: 0, isRubble: true, delay: 0 };
    }
    this.rebuildTargets = mappings;
    this.rebuildStartTime = Date.now();
    this.state = AppState.REBUILDING;
    this.onStateChange(this.state);
  }

  private updatePhysics() {
    if (this.state === AppState.DISMANTLING) {
        let allSettled = true;
        this.voxels.forEach(v => {
            v.vy -= 0.04;
            v.x += v.vx; v.y += v.vy; v.z += v.vz;
            v.rx += v.rvx; v.ry += v.rvy; v.rz += v.rvz;
            if (v.y < CONFIG.FLOOR_Y + 0.5) {
                v.y = CONFIG.FLOOR_Y + 0.5;
                v.vy *= -0.4; v.vx *= 0.8; v.vz *= 0.8;
                v.rvx *= 0.7; v.rvy *= 0.7; v.rvz *= 0.7;
            }
            if (Math.abs(v.vy) > 0.01 || Math.abs(v.vx) > 0.01) allSettled = false;
        });
    } else if (this.state === AppState.REBUILDING) {
        const now = Date.now();
        const elapsed = now - this.rebuildStartTime;
        let allDone = true;
        const speed = 0.15;
        const threshold = 0.05;
        for (let i = 0; i < this.voxels.length; i++) {
            const v = this.voxels[i];
            const t = this.rebuildTargets[i];
            if (!t) continue;
            if (elapsed < t.delay) { allDone = false; continue; }
            const dx = t.x - v.x; const dy = t.y - v.y; const dz = t.z - v.z;
            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold || Math.abs(dz) > threshold) {
                v.x += dx * speed; v.y += dy * speed; v.z += dz * speed;
                v.rx *= (1 - speed); v.ry *= (1 - speed); v.rz *= (1 - speed);
                allDone = false;
            } else { v.x = t.x; v.y = t.y; v.z = t.z; v.rx = 0; v.ry = 0; v.rz = 0; }
        }
        if (allDone) { this.state = AppState.STABLE; this.onStateChange(this.state); }
    }
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.updatePhysics();
    if (this.state !== AppState.STABLE || this.controls.autoRotate) this.draw();
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize() {
    if (!this.camera || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public getJsonData(): string {
    const data = this.voxels.map((v, i) => ({
      id: i, x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2),
      color: v.color.getHex()
    }));
    return JSON.stringify(data, null, 2);
  }

  public cleanup() {
    cancelAnimationFrame(this.animationId);
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
  }
}

// --- Main App Component ---
export interface AgentLeeFormProps {
  voxelCode?: string | null;
  savedVoxels?: any[];
  isSpeaking?: boolean;
  isChangingForm?: boolean;
  size?: 'large' | 'small';
  className?: string;
  backgroundImage?: string | null;
  enabledShapes?: string[];
  onShapeChange?: (name: string) => void;
  onClick?: () => void;
}

export default function AgentLeeForm({
  voxelCode,
  savedVoxels,
  isSpeaking,
  isChangingForm,
  size = 'large',
  className,
  backgroundImage,
  enabledShapes = [],
  onShapeChange,
  onClick
}: AgentLeeFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  // Camera popup state (unified governance: all UI state inside component)
  const [cameraVisible, setCameraVisible] = useState(false);
  useEffect(() => {
    const handleTrigger = (e: CustomEvent) => {
      const phrase = (e.detail?.phrase || '').toLowerCase();
      if ([
        'look at this',
        'did you see that',
        'what do you see',
        'show me',
        'take a look',
        'see this',
      ].some(trigger => phrase.includes(trigger))) {
        setCameraVisible(true);
      }
      if (phrase.includes('close camera') || phrase.includes('hide camera')) {
        setCameraVisible(false);
      }
    };
    window.addEventListener('agentlee:cameraTrigger', handleTrigger as EventListener);
    return () => window.removeEventListener('agentlee:cameraTrigger', handleTrigger as EventListener);
  }, []);
  const [dynamicShapeKeys, setDynamicShapeKeys] = useState<string[]>(Object.keys(Generators));
  useEffect(() => {
    const keys = Object.keys(Generators);
    setDynamicShapeKeys(keys);
  }, []); // Only once on mount or when Generators (static) is stable

  // Filter allowed keys to only those that exist in our Generators registry
  const rawAllowedKeys = enabledShapes && enabledShapes.length > 0 ? enabledShapes : dynamicShapeKeys;
  const allowedShapeKeys = rawAllowedKeys.filter(key => key in Generators);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationQueue, setRotationQueue] = useState<VoxelData[][]>([Generators[allowedShapeKeys[0] as keyof typeof Generators]()]);

  // Keep a ref so the 30s interval always sees the latest appState without re-creating
  const appStateRef = useRef<AppState>(AppState.STABLE);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // --- Agent Lee always-on awareness and proactive suggestions ---
  const lastActivityRef = useRef<number>(Date.now());
  useAgentLeeAwareness(activity => {
    lastActivityRef.current = Date.now();
    // Example: Proactive suggestion logic (no-op, or add valid eventBus event if needed)
    // You can add valid eventBus.emit('router:intent', ...) or similar here if desired
  });

  const speak = useCallback(async (text: string) => {
    if (isMuted) return;
    try {
      // Unified Governance: Only use allowed events from EventMap. If TTS activity needs to be tracked, use 'router:intent' or another approved event.
      // eventBus.emit('router:intent', { intent: 'speak', mode: 'local', confidence: 1, reason: 'TTS' });
      sendTTS(text);
    } catch (error) {
      console.error("Voxel TTS Error:", error);
    }
  }, [isMuted]);

  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      engineRef.current = new VoxelEngine(containerRef.current, setAppState, setVoxelCount);
      engineRef.current.loadInitialModel(rotationQueue[0]);
    }
    const handleResize = () => engineRef.current?.handleResize();
    window.addEventListener('resize', handleResize);
    return () => { 
      window.removeEventListener('resize', handleResize); 
      if (engineRef.current) {
        engineRef.current.cleanup(); 
        engineRef.current = null;
      }
    };
  }, []);


  // Instant and dynamic shape cycling logic
  const cycleToShape = useCallback((shapeKey: string) => {
    if (!engineRef.current || !Generators[shapeKey as keyof typeof Generators]) return;
    const data = Generators[shapeKey as keyof typeof Generators]();
    engineRef.current.dismantle();
    setTimeout(() => {
      engineRef.current?.rebuild(data);
      if (onShapeChange) onShapeChange(shapeKey);
    }, 100); // much faster switch
    setCurrentIndex(allowedShapeKeys.indexOf(shapeKey));
  }, [allowedShapeKeys, onShapeChange]);

  // Auto-morphing logic: cycle every 20 seconds
  useEffect(() => {
    if (!allowedShapeKeys.length || allowedShapeKeys.length < 2) return;
    
    const interval = setInterval(() => {
      // Don't morph if agent is busy (speaking or generating)
      if (isSpeaking || isGenerating) return;

      setCurrentIndex(prev => {
        const next = (prev + 1) % allowedShapeKeys.length;
        const nextShape = allowedShapeKeys[next];
        cycleToShape(nextShape);
        return next;
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [allowedShapeKeys, isSpeaking, isGenerating, cycleToShape]);

  // Listen for a global event to cycle instantly (for voice/manual control)

  // Shape selection buttons removed for side panel migration

  // On mount, always start with the first enabled shape
  useEffect(() => {
    if (!engineRef.current || !allowedShapeKeys.length) return;
    const data = Generators[allowedShapeKeys[0] as keyof typeof Generators]();
    engineRef.current.loadInitialModel(data);
    if (onShapeChange) onShapeChange(allowedShapeKeys[0]);
    setCurrentIndex(0);
  }, [allowedShapeKeys.join(',')]);

  const handleSendMessage = async (prompt: string, image?: string) => {
    setIsGenerating(true);
    
    const voxelPrompt = `
      You are a Team of Specialist Voxel Agents:
      - Agent Orion [role:structuralist] [cap:structure]
      - Agent Chroma [role:colorist] [cap:color]
      - Agent Echo [role:presenter] [cap:tts]
      - Agent Pulse [role:animator] [cap:animate]

      Goal: Turn the user request into a 3D voxel structure.
      
      Requirements:
      1. voxels: Array of {x, y, z, color (decimal)} (100-250 count).
      2. commentary: Professional confirmation (max 15 words).
      
      Output ONLY CLEAN JSON. No markdown. No chatter.
    `;

    try {
      const response = await LeewayInferenceClient.generate({
        prompt: `Request: ${prompt}`,
        systemPrompt: `${CORE_SYSTEM}\n\nSPECIALIST VOXEL MANIFESTATION:\n${voxelPrompt}`,
        agent: 'Pixel',
        imageBase64: image?.split(',')[1],
        temperature: 0.7,
      });

      if (response.text) {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid voxel data');
        
        const result = JSON.parse(jsonMatch[0]);
        const voxels = result.voxels;
        const commentary = result.commentary;
        
        setRotationQueue(prev => [...prev, voxels]);
        if (engineRef.current) {
          engineRef.current.dismantle();
          setTimeout(() => {
            engineRef.current?.rebuild(voxels);
            setCurrentIndex(rotationQueue.length);
            // Speak commentary directly via browser TTS
            if (commentary && !isMuted) {
              window.speechSynthesis.cancel();
              const utt = new SpeechSynthesisUtterance(commentary);
              utt.rate = 0.95;
              utt.pitch = 0.8;
              const voices = window.speechSynthesis.getVoices();
              const preferred = voices.find(v => /leeway US English|Samantha|Microsoft David/i.test(v.name));
              if (preferred) utt.voice = preferred;
              window.speechSynthesis.speak(utt);
            }
            // Unified Governance: Only use allowed events from EventMap. If completion needs to be tracked, use 'router:intent' or another approved event.
            // if (commentary) eventBus.emit('router:intent', { intent: 'done', mode: 'local', confidence: 1, reason: 'Pixel commentary' });
          }, 1500);
        }
      }
    } catch (e) {
      console.error("Voxel Generation Error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (engineRef.current) {
      const data = engineRef.current.getJsonData();
      navigator.clipboard.writeText(data);
      speak("I've copied the voxel data to your clipboard.");
    }
  };

  const handleDownload = () => {
    if (engineRef.current) {
      const data = engineRef.current.getJsonData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `voxel-object-${currentIndex + 1}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      speak("I've prepared the file for download.");
    }
  };

  useEffect(() => {
    // Unified Governance: Only use allowed events from EventMap. If you need to listen for generation, use an approved event like 'router:intent' or add to EventMap.
    // const handleGenerate = (data: any) => {
    //   handleSendMessage(data.prompt, data.image);
    // };
    // const unsub = eventBus.on('router:intent', handleGenerate); // Example for governance-compliant event
    // Bouncing animation if speaking
    if (isSpeaking && containerRef.current) {
      containerRef.current.style.transform = "translateY(-5px)";
      setTimeout(() => {
        if (containerRef.current) containerRef.current.style.transform = "translateY(0px)";
      }, 200);
    }
    // No event subscription, so no cleanup needed
    return undefined;
  }, [isSpeaking]);

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 w-full h-full bg-black cursor-pointer ${className || ''}`}
    >
      {/* THREE.js canvas mount point - pointer events enabled for interactivity */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Camera popup (movable, only when triggered) */}
      <AgentLeeCameraPopup visible={cameraVisible} onClose={() => setCameraVisible(false)} />

      {/* ── LARGE MODE UI ── */}
      {size === 'large' && (
        <>
          {/* Speaking glow ring */}
          {isSpeaking && (
            <div className="absolute inset-0 z-0 pointer-events-none border-4 border-cyan-400/40 rounded-3xl animate-pulse" />
          )}
        </>
      )}

      {/* ── SMALL (MINIMIZED) MODE — show Agent Lee model and speaking ring ── */}
      {size === 'small' && (
        <>
          <div className="absolute inset-0" />
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-pulse pointer-events-none z-10" />
          )}
        </>
      )}
    </div>
  );
}

