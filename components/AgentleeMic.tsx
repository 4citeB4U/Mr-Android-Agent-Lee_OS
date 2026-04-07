/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.MIC.ADVANCED
TAG: UI.COMPONENT.MIC.AGENTLEE.VOXEL

COLOR_ONION_HEX:
NEON=#FFD700
FLUO=#FFF176
PASTEL=#FFF9C4

ICON_ASCII:
family=lucide
glyph=mic

5WH:
WHAT = Advanced 3D voxel microphone system integrated with Agent Lee's voice I/O and background task execution
WHY = Sole voice interface for system; fully integrated with Gemini Live API, Firebase persistence, and EventBus
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentleeMic.tsx
WHEN = 2026
HOW = Three.js voxel rendering + Gemini Live bidirectional audio + FirebaseService for persistence

AGENTS:
ASSESS
ECHO
GEMINI

LICENSE:
MIT
*/

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion } from 'motion/react';
import { FirebaseService } from '../core/FirebaseService';
import { BackgroundTaskManager } from '../core/BackgroundTaskManager';
import { eventBus } from '../core/EventBus';
import LeewayRTCClient, { RTCState as LeewayRTCState } from '../core/LeewayRTCClient';
import AgentLeeResponseRouter from '../core/AgentLeeResponseRouter';

// --- Types & Constants ---
export enum AgentState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  ERROR = 'error'
}

const V_RES = 0.75; 
const palette = {
  gold: new THREE.Color(0xFFD700),
  bright: new THREE.Color(0xFFF9D6),
  active: new THREE.Color(0x00F2FF),
  speaking: new THREE.Color(0xFF00E5),
};

// Voxel text rendering for 3D display
const font = {
  'L': [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1],
  'E': [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1]
};
const textStr = "LEE";

// --- Agent Service Logic (LeeWay-RTC Integrated) ---
/**
 * LeewayAgentService wraps LeewayRTCClient for use in React component
 * Maps LeeWay RTC states to AgentState enum
 */
class LeewayAgentService {
  private rtcClient: LeewayRTCClient;
  private firebase: FirebaseService;
  private backgroundTaskManager: BackgroundTaskManager;
  private currentUserId: string | null = null;
  private sessionId: string = '';

  constructor(private onStateChange: (state: AgentState) => void) {
    this.rtcClient = LeewayRTCClient.getInstance();
    this.firebase = FirebaseService.getInstance();
    this.backgroundTaskManager = BackgroundTaskManager.getInstance();

    // Listen for auth changes
    eventBus.on('firebase:auth-change', (data: any) => {
      this.currentUserId = data.user?.uid || null;
    });

    // Get current user if already signed in
    const currentUser = this.firebase.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.uid;
    }

    // Listen to LeeWay-RTC state changes
    eventBus.on('leeway-rtc:state-change', (data: any) => {
      this.mapRTCStateToAgentState(data.state);
    });

    eventBus.on('leeway-rtc:error', (data: any) => {
      console.error('[LeewayAgentService] RTC Error:', data.error);
      this.onStateChange(AgentState.ERROR);
      eventBus.emit('mic:error', { sessionId: this.sessionId, error: data.error });
    });

    eventBus.on('leeway-rtc:speaking', (data: any) => {
      this.onStateChange(AgentState.SPEAKING);
    });

    eventBus.on('leeway-rtc:listening', () => {
      this.onStateChange(AgentState.LISTENING);
    });
  }

  /**
   * Map LeeWay RTC states to AgentState enum
   */
  private mapRTCStateToAgentState(rtcState: LeewayRTCState): void {
    const mapping: Record<LeewayRTCState, AgentState> = {
      [LeewayRTCState.IDLE]: AgentState.IDLE,
      [LeewayRTCState.CONNECTING]: AgentState.THINKING,
      [LeewayRTCState.CONNECTED]: AgentState.LISTENING,
      [LeewayRTCState.LISTENING]: AgentState.LISTENING,
      [LeewayRTCState.THINKING]: AgentState.THINKING,
      [LeewayRTCState.SPEAKING]: AgentState.SPEAKING,
      [LeewayRTCState.ERROR]: AgentState.ERROR,
    };
    this.onStateChange(mapping[rtcState]);
  }

  async start(): Promise<void> {
    try {
      this.sessionId = `mic_session_${Date.now()}`;
      this.onStateChange(AgentState.THINKING);

      // Emit event for other components
      eventBus.emit('mic:session-started', { sessionId: this.sessionId });

      // Connect to LeeWay-RTC
      await this.rtcClient.connect((state) => {
        this.mapRTCStateToAgentState(state);
      });

      // Start listening for voice input
      await this.rtcClient.startListening();

      console.log('[LeewayAgentService] Connected to LeeWay-RTC and listening');

      // Log session start to Firebase
      if (this.currentUserId) {
        await this.firebase.logMemoryEntry(this.currentUserId, {
          agentId: 'AgentleeMic',
          agentName: 'AgentleeMic',
          action: 'Voice Session Started (LeeWay-RTC)',
          details: 'User initiated voice interaction via LeeWay-Edge-RTC',
          impact: 'medium',
          metadata: { sessionId: this.sessionId, transport: 'leeway-rtc' },
        });
      }
    } catch (error) {
      this.onStateChange(AgentState.ERROR);
      console.error('[LeewayAgentService] Start error:', error);
      eventBus.emit('mic:error', { sessionId: this.sessionId, error });
    }
  }

  stop(): void {
    this.rtcClient.stopListening();
    this.rtcClient.disconnect();
    this.onStateChange(AgentState.IDLE);

    // Log session end to Firebase
    if (this.currentUserId) {
      this.firebase
        .logMemoryEntry(this.currentUserId, {
          agentId: 'AgentleeMic',
          agentName: 'AgentleeMic',
          action: 'Voice Session Ended (LeeWay-RTC)',
          details: 'Voice interaction session concluded',
          impact: 'low',
          metadata: { sessionId: this.sessionId },
        })
        .catch((err) => {
          console.error('[LeewayAgentService] Failed to log session end:', err);
        });
    }

    eventBus.emit('mic:session-ended', { sessionId: this.sessionId });
  }

  /**
   * Send a voice command as a background task for Agent Lee to execute
   */
  async sendBackgroundCommand(
    objective: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const taskId = await this.backgroundTaskManager.queueTask({
        userId: this.currentUserId,
        objective,
        priority,
        source: 'voice',
        metadata: {
          micSessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        },
      });

      // Log the command to memory
      await this.firebase.logMemoryEntry(this.currentUserId, {
        agentId: 'AgentleeMic',
        agentName: 'AgentleeMic',
        action: 'Background Command Queued',
        details: objective,
        impact: 'high',
        metadata: { taskId, source: 'voice' },
      });

      return taskId;
    } catch (error) {
      console.error('[AgentleeMic] Failed to queue background command:', error);
      throw error;
    }
  }
}

// --- Main Component ---
interface AgentLeeMicProps {
  compact?: boolean; // For footer use
  onStateChange?: (state: AgentState) => void;
}

export const AgentLeeMic: React.FC<AgentLeeMicProps> = ({ compact = false, onStateChange: externalStateChange }) => {
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const agentRef = useRef<LeewayAgentService | null>(null);
  const stateRef = useRef(state);
  const clickStartTime = useRef(0);
  const clickStartPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    stateRef.current = state;
    externalStateChange?.(state);
  }, [state, externalStateChange]);

  useEffect(() => {
    agentRef.current = new LeewayAgentService((s) => setState(s));
    return () => agentRef.current?.stop();
  }, []);

  const toggleAgent = async () => {
    if (stateRef.current === AgentState.IDLE) {
      await agentRef.current?.start();
    } else {
      agentRef.current?.stop();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(30, containerRef.current.clientWidth / containerRef.current.clientHeight, 1, 1000);
    camera.position.set(0, 5, compact ? 50 : 120);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(1);
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = compact ? 1.5 : 0.5;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = compact ? 5 : 10;
    controls.maxDistance = compact ? 50 : 400;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 30);
    scene.add(mainLight);

    const generateVoxels = () => {
      const data: { x: number, y: number, z: number, c: THREE.Color }[] = [];
      const add = (x: number, y: number, z: number, c: THREE.Color) => data.push({ x, y, z, c });

      for (let y = -28; y <= 35; y += V_RES) {
        for (let x = -18; x <= 18; x += V_RES) {
          for (let z = -18; z <= 18; z += V_RES) {
            const rSq = x * x + z * z;
            const r = Math.sqrt(rSq);

            if (y > 10) {
              let domeR = (y < 22) ? r : Math.sqrt(rSq + Math.pow(y - 22, 2));
              if (domeR > 12.8 && domeR < 14.2) {
                let angle = Math.atan2(x, z);
                if (Math.abs(Math.sin(angle * 10 + y)) > 0.85 || Math.abs(Math.sin(angle * 10 - y)) > 0.85) add(x, y, z, palette.gold);
              }
            }
            else if (y >= 0 && y <= 10) {
              if (r > 13 && r < 15.5) {
                let isPixel = false;
                let angle = Math.atan2(x, z);
                const renderTextOnSide = (targetAngle: number) => {
                  let diff = angle - targetAngle;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  if (Math.abs(diff) < 0.7) { 
                    const scale = 1.8; 
                    let vx = (diff * 14.5) / scale; 
                    let vy = (y - 5) / scale;
                    let charXOffset = 0;
                    for (let char of textStr) {
                      let lx = Math.floor(vx + 5.5 - charXOffset);
                      let ly = Math.floor(2.5 - vy);
                      if (lx >= 0 && lx < 3 && ly >= 0 && ly < 5) {
                        if ((font as any)[char][ly * 3 + lx] === 1) {
                          add(x, y, z, palette.bright);
                          isPixel = true;
                          return true;
                        }
                      }
                      charXOffset += 4;
                    }
                  }
                  return false;
                };
                if (!renderTextOnSide(0)) renderTextOnSide(Math.PI);
                if (!isPixel) add(x, y, z, palette.gold);
              }
            }
            else if (y < 0 && y > -16) {
              let sphereR = Math.sqrt(rSq + Math.pow(y + 2, 2));
              if (sphereR > 13.2 && sphereR < 14.8) add(x, y, z, palette.gold);
            }
            const yokeR = 18.5;
            if (Math.abs(x) > 16.5 && Math.abs(x) < 20.5 && Math.abs(z) < 2 && y < 8 && y > -10) add(x, y, z, palette.gold);
            if (Math.abs(x) > 16.5 && Math.abs(x) < 20.5 && Math.abs(z) < 2.5 && Math.sqrt(Math.pow(y - 5, 2) + z * z) < 3.5) add(x, y, z, palette.bright);
            if (y <= -10 && y > -22) {
              let dist = Math.sqrt(x * x + Math.pow(y + 10, 2));
              if (Math.abs(dist - yokeR) < 2 && Math.abs(z) < 2) add(x, y, z, palette.gold);
            }
            if (y <= -22 && y > -28 && r < 3) add(x, y, z, palette.gold);
            if (y <= -28 && y > -32 && r < 16) add(x, y, z, palette.gold);
            if (y <= -26 && y > -28 && r < 4) add(x, y, z, palette.gold);
          }
        }
      }
      return data;
    };

    const voxelData = generateVoxels();
    const geo = new THREE.BoxGeometry(V_RES * 0.95, V_RES * 0.95, V_RES * 0.95);
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.2 });
    const mesh = new THREE.InstancedMesh(geo, mat, voxelData.length);
    const dummy = new THREE.Object3D();

    voxelData.forEach((v, i) => {
      dummy.position.set(v.x, v.y, v.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, v.c);
    });
    scene.add(mesh);
    (meshRef as any).current = mesh;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      mesh.position.y = Math.sin(Date.now() * 0.001) * 2;
      const currentState = stateRef.current;
      if (currentState === AgentState.LISTENING) {
        const s = 1 + Math.sin(Date.now() * 0.01) * 0.05;
        mesh.scale.set(s, s, s);
      } else if (currentState === AgentState.SPEAKING) {
        const s = 1 + Math.sin(Date.now() * 0.02) * 0.1;
        mesh.scale.set(s, s, s);
      } else {
        mesh.scale.set(1, 1, 1);
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const onPointerDown = (e: PointerEvent) => {
      clickStartTime.current = Date.now();
      clickStartPosition.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      const duration = Date.now() - clickStartTime.current;
      const dist = Math.sqrt(Math.pow(e.clientX - clickStartPosition.current.x, 2) + Math.pow(e.clientY - clickStartPosition.current.y, 2));
      if (duration < 250 && dist < 10) toggleAgent();
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={compact ? "w-32 h-32 relative" : "fixed inset-0 bg-black overflow-hidden flex flex-col"}>
      <div ref={containerRef} className={compact ? "w-full h-full" : "flex-1 relative"} />
      
      {/* Error Indicator Overlay - Compact Mode */}
      {compact && state === AgentState.ERROR && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-full h-full bg-red-500/20 rounded-full backdrop-blur-sm flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-500/30 border-2 border-red-400 flex items-center justify-center">
              <div className="text-xs text-red-300 font-bold">!</div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Indicator - Compact Mode */}
      {compact && state === AgentState.LISTENING && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full rounded-full border-2 border-cyan-400/50 animate-pulse" />
        </div>
      )}

      {/* Speaking Indicator - Compact Mode */}
      {compact && state === AgentState.SPEAKING && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full rounded-full border-2 border-fuchsia-400 animate-pulse" />
        </div>
      )}
      
      {/* Minimalist Status Overlay - Only for full screen */}
      {!compact && state !== AgentState.IDLE && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                state === AgentState.LISTENING ? 'bg-cyan-400' : 
                state === AgentState.SPEAKING ? 'bg-fuchsia-400' : 
                state === AgentState.ERROR ? 'bg-red-500' : 'bg-yellow-400'
              }`} />
              <span className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-medium">
                {state === AgentState.LISTENING ? 'Listening' : 
                 state === AgentState.SPEAKING ? 'Speaking' : 
                 state === AgentState.ERROR ? 'Error' : 'Thinking'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Glows - Only for full screen */}
      {!compact && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)] pointer-events-none" />
        </>
      )}
    </div>
  );
};
