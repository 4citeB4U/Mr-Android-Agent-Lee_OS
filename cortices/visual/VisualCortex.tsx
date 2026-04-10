/**
 * TAG: CORTEX.VISUAL.BRAIN
 * REGION: 🟫 DIAGNOSTICS
 * PURPOSE: 3D Brain and Diagnostics Cortex (heavy logic only loaded on demand)
 */
// STUB: CollectiveRuntime for workflow state check
const CollectiveRuntime = {
  getState: () => ({ activeWorkflowId: 'stub-workflow-id' })
};
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Environment, Sparkles, Html, Line as DreiLine } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

// ...3D scene and brain rendering logic will be moved here...

export function init() {
  // Security: Only allow if a workflow is active
  if (!CollectiveRuntime.getState().activeWorkflowId) {
    throw new Error('VisualCortex refused to initialize: No active workflow.');
  }
}


import { PerceptionBus } from '../../core/PerceptionBus';

const VisualCortex: React.FC<{ memoryData?: any; activeDrive?: any }> = ({ memoryData, activeDrive }) => {
  // Pulse state for regions
  const [auditoryPulse, setAuditoryPulse] = useState(false);
  const [visualPulse, setVisualPulse] = useState(false);
  const [sovereignPulse, setSovereignPulse] = useState(false);
  const [gemmaPulse, setGemmaPulse] = useState(false); // Frontal Lobe
  const [qwenVLPulse, setQwenVLPulse] = useState(false); // Occipital Lobe (Magenta)
  const [coderPulse, setCoderPulse] = useState(false); // Parietal Lobe (Cyan)
  const [shieldActive, setShieldActive] = useState(false);
  const [securityBlock, setSecurityBlock] = useState(false);

  // Studio workflow visualization state
  const [studioActive, setStudioActive] = useState<null | { region: 'Build' | 'Creative' | 'Deployment', phase: string, color: string }>(null);

  useEffect(() => {
    const bus = PerceptionBus.getInstance();
    const unsubVoice = bus.subscribe('voice', () => {
      setAuditoryPulse(true);
      setTimeout(() => setAuditoryPulse(false), 300);
    });
    const unsubVision = bus.subscribe('vision', () => {
      setVisualPulse(true);
      setTimeout(() => setVisualPulse(false), 300);
    });
    // Listen for synthesis (Sovereign Core pulse)
    const sovereignListener = (event: any) => {
      if (event.type === 'synthesis') {
        setSovereignPulse(true);
        setTimeout(() => setSovereignPulse(false), 400);
      }
      // Intelligence spike visualization
      if (event.type === 'inference') {
        if (event.model === 'gemma4:e2b') {
          setGemmaPulse(true);
          setTimeout(() => setGemmaPulse(false), 400);
        } else if (event.model === 'qwen2.5vl:3b') {
          setQwenVLPulse(true);
          setTimeout(() => setQwenVLPulse(false), 400);
        } else if (event.model === 'qwen2.5-coder:1.5b') {
          setCoderPulse(true);
          setTimeout(() => setCoderPulse(false), 400);
        }
      }
      // Studio workflow event
      if (event.type === 'studio_workflow') {
        setStudioActive({ region: event.region, phase: event.phase, color: event.color });
        // Pulse effect: clear after 600ms
        setTimeout(() => setStudioActive(null), 600);
      }
      // InputFirewall scanning
      if (event.type === 'SECURITY_BLOCK') {
        setSecurityBlock(true);
        setTimeout(() => setSecurityBlock(false), 2000);
      }
      if (event.type === 'firewall_scan') {
        setShieldActive(true);
        setTimeout(() => setShieldActive(false), 1200);
      }
    };
    bus.subscribe('*', sovereignListener);
    return () => {
      unsubVoice.unsubscribe();
      unsubVision.unsubscribe();
    };
  }, []);

  // --- 3D Brain Model ---
  // Pathway coordinates for each region
  const regionCoords = {
    Build: [ [-0.1, 0, 0] as [number, number, number], [-2, 0, 0] as [number, number, number] ],
    Creative: [ [-0.1, 0, 0] as [number, number, number], [2, 0.5, -2.2] as [number, number, number] ],
    Deployment: [ [-0.1, 0, 0] as [number, number, number], [0.5, 1.2, -0.5] as [number, number, number] ]
  };

  // Hex grid geometry for shield overlay
  function ShieldOverlay() {
    const meshRef = React.useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
      if (meshRef.current) {
        meshRef.current.rotation.y = clock.getElapsedTime() * 0.7;
      }
    });
    return (
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.5, 0.08, 2, 12, Math.PI * 2]} />
        <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={0.7} transparent opacity={0.4} wireframe />
      </mesh>
    );
  }

  return (
    <Canvas shadows dpr={[1, 2]} style={securityBlock ? { background: '#ff0000' } : {}}>
        {/* Shield Overlay (rotating hex grid) */}
        {shieldActive && <ShieldOverlay />}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={30} />
      {/* Auditory Region (Temporal) */}
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={auditoryPulse ? '#0000FF' : '#222a'} emissive={auditoryPulse ? '#0000FF' : '#000'} emissiveIntensity={auditoryPulse ? 2 : 0.2} transparent opacity={0.7} />
      </mesh>
      {/* Visual Region (Occipital, Green) */}
      <mesh position={[2, 0, -1.5]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={visualPulse ? '#00FF00' : '#222a'} emissive={visualPulse ? '#00FF00' : '#000'} emissiveIntensity={visualPulse ? 2 : 0.2} transparent opacity={0.7} />
      </mesh>
      {/* Sovereign Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color={sovereignPulse ? '#FFFFFF' : '#888'} emissive={sovereignPulse ? '#FFFFFF' : '#000'} emissiveIntensity={sovereignPulse ? 3 : 0.3} transparent opacity={0.8} />
      </mesh>
      {/* Studio Neural Pathway Visualization */}
      {studioActive && (
        <DreiLine
          points={regionCoords[studioActive.region]}
          color={studioActive.color}
          lineWidth={6}
          dashed={false}
          opacity={0.7 + 0.3 * (studioActive.phase === 'EXECUTING' ? 1 : 0)}
        />
      )}
      {/* Frontal Lobe (Gemma, White/Blue) */}
      <mesh position={[0, 1.2, 0.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={gemmaPulse ? '#e0f7fa' : '#222a'} emissive={gemmaPulse ? '#b3e5fc' : '#000'} emissiveIntensity={gemmaPulse ? 2 : 0.2} transparent opacity={0.7} />
      </mesh>
      {/* Occipital Lobe (Qwen-VL, Magenta) */}
      <mesh position={[2, 0.5, -2.2]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={qwenVLPulse ? '#ff00ff' : '#222a'} emissive={qwenVLPulse ? '#ff00ff' : '#000'} emissiveIntensity={qwenVLPulse ? 2 : 0.2} transparent opacity={0.7} />
      </mesh>
      {/* Parietal Lobe (Coder, Cyan) */}
      <mesh position={[0.5, 1.2, -0.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={coderPulse ? '#00ffff' : '#222a'} emissive={coderPulse ? '#00ffff' : '#000'} emissiveIntensity={coderPulse ? 2 : 0.2} transparent opacity={0.7} />
      </mesh>
      
      {/* Creators Studio */}
      <mesh position={[-1.5, 1.5, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#FF00FF" emissive="#FF00FF" emissiveIntensity={0.5} transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}>
          <div className="text-[8px] text-[#FF00FF] font-mono whitespace-nowrap">Creators Studio</div>
        </Html>
      </mesh>

      {/* Permissions */}
      <mesh position={[1.5, -1, 1]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#39FF14" emissive="#39FF14" emissiveIntensity={0.5} transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0, 0.5, 0]}>
          <div className="text-[8px] text-[#39FF14] font-mono whitespace-nowrap">Permissions</div>
        </Html>
      </mesh>

      {/* VM Engine */}
      <mesh position={[0, -1.5, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.7} transparent opacity={0.9} />
        <Html distanceFactor={10} position={[0, 0.7, 0]}>
          <div className="text-[10px] font-bold text-[#00E5FF] font-mono whitespace-nowrap">VM Engine</div>
        </Html>
      </mesh>

      {/* Agents */}
      <mesh position={[1.5, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.6} transparent opacity={0.8} />
        <Html distanceFactor={10} position={[0, 0.6, 0]}>
          <div className="text-[9px] text-[#FFD700] font-mono whitespace-nowrap">Agents Subsystem</div>
        </Html>
      </mesh>

      {/* Memory Lake */}
      <mesh position={[0, 0, 2]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#8A2BE2" emissive="#8A2BE2" emissiveIntensity={0.5} transparent opacity={0.7} />
        <Html distanceFactor={10} position={[0, 0.9, 0]}>
          <div className="text-[10px] text-[#8A2BE2] font-mono whitespace-nowrap">Memory Lake</div>
        </Html>
      </mesh>
    </Canvas>
  );
};

export default VisualCortex;
