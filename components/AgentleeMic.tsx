// ...existing code...
import React, { useState, useEffect, useRef } from "react";
import { Mic } from 'lucide-react';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AgentState } from "../core/AgentWorldTypes";
import { AgentService } from "../core/agent_lee_persona";
import { MORPH_FORMS, Generators, V_RES } from "../core/agent_lee_behavior_contract";


export interface AgentLeeMicProps {
  className?: string;
  compact?: boolean;
  onStateChange?: (state: AgentState) => void;
}

export const AgentLeeMic: React.FC<AgentLeeMicProps> = ({ className = '', compact = false, onStateChange }) => {
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const [morphIndex, setMorphIndex] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<AgentState>(AgentState.IDLE);
  const agentRef = useRef<AgentService | null>(null);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    const interval = setInterval(() => {
      setMorphIndex((prev: number) => (prev + 1) % MORPH_FORMS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    try {
      agentRef.current = new AgentService((s: AgentState) => {
        setState(s);
        if (onStateChange) onStateChange(s);
      });
      return () => agentRef.current?.stop();
    } catch (err: any) {
      setMicError('[AgentLeeMic] AgentService init error: ' + (err?.message || String(err)));
    }
  }, [onStateChange]);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!containerRef.current) return;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;
    let mesh: THREE.InstancedMesh | null = null;
    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, containerRef.current.clientWidth / containerRef.current.clientHeight, 1, 1000);
      camera.position.set(0, 5, 120);
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(1);
      containerRef.current.appendChild(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableRotate = false;
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;
      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 2.0));
      // Voxels (Morphing)
      let currentForm = MORPH_FORMS[morphIndex];
      let generator = Generators[currentForm as keyof typeof Generators];
      let voxelData = generator ? generator() : [];
      const geo = new THREE.BoxGeometry(V_RES, V_RES, V_RES);
      const mat = new THREE.MeshStandardMaterial({ metalness: 0.95, roughness: 0.1 });
      mesh = new THREE.InstancedMesh(geo, mat, voxelData.length);
      const dummy = new THREE.Object3D();
      voxelData.forEach((v: any, i: number) => {
        dummy.position.set(v.x, v.y, v.z);
        dummy.updateMatrix();
        mesh!.setMatrixAt(i, dummy.matrix);
        mesh!.setColorAt(i, new THREE.Color(v.color));
      });
      scene.add(mesh);
      const animate = () => {
        renderer!.render(scene!, camera!);
        requestAnimationFrame(animate);
      };
      animate();
      return () => {
        if (renderer && containerRef.current) {
          renderer.dispose();
          if (renderer.domElement.parentNode === containerRef.current) containerRef.current.removeChild(renderer.domElement);
        }
      };
    } catch (err: any) {
      setMicError('[AgentLeeMic] WebGL/Three.js error: ' + (err?.message || String(err)));
    }
  }, [morphIndex]);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-red-500 font-bold">
          Agent Lee Mic unavailable (SSR or non-browser environment)
        </div>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`} data-testid="agentlee-mic-root">
      <div data-testid="mic-mounted" style={{position:'absolute',top:0,left:0,width:1,height:1,opacity:0}}>mounted</div>
      {micError && (
        <div data-testid="mic-error" className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-red-500 font-bold text-center p-4">
          {micError}
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded shadow font-bold pointer-events-none" data-testid="mic-morph-label">
        {MORPH_FORMS[morphIndex]}
      </div>
      {/* Mic Button - always visible */}
      <button
        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full p-3 shadow-lg z-20 flex items-center justify-center border-2 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        style={{ width: 48, height: 48 }}
        aria-label="Activate Mic"
        onClick={() => alert('Mic button pressed (demo)')}
      >
        <Mic size={24} />
      </button>
    </div>
  );
};

// Export types and enums only after all definitions
export { AgentState };

